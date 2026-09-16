const chai = require('chai');
const chaiHttp = require('chai-http');
const { expect } = chai;
const { startTestServer, stopTestServer, clearDatabase, registerAndLogin } = require('./testServer');

chai.use(chaiHttp);

describe('Adopting a dog', () => {
	let app;

	before(async () => {
		app = await startTestServer();
	});

	after(async () => {
		await stopTestServer();
	});

	afterEach(async () => {
		await clearDatabase();
	});

	async function registerDog(app, token, overrides = {}) {
		const res = await chai
			.request(app)
			.post('/api/dogs')
			.set('Authorization', `Bearer ${token}`)
			.send({ name: 'Rex', description: 'Friendly dog', ...overrides });
		return res.body;
	}

	it('lets an authenticated user adopt another user\'s dog with a thank-you message', async () => {
		const ownerToken = await registerAndLogin(app, 'owner1');
		const adopterToken = await registerAndLogin(app, 'adopter1');
		const dog = await registerDog(app, ownerToken);

		const res = await chai
			.request(app)
			.post(`/api/dogs/${dog._id}/adopt`)
			.set('Authorization', `Bearer ${adopterToken}`)
			.send({ thankYouMessage: 'Thank you so much for Rex!' });

		expect(res).to.have.status(200);
		expect(res.body.status).to.equal('adopted');
		expect(res.body.thankYouMessage).to.equal('Thank you so much for Rex!');
	});

	it('rejects adopting a dog that is already adopted', async () => {
		const ownerToken = await registerAndLogin(app, 'owner1');
		const adopterToken = await registerAndLogin(app, 'adopter1');
		const secondAdopterToken = await registerAndLogin(app, 'adopter2');
		const dog = await registerDog(app, ownerToken);

		await chai
			.request(app)
			.post(`/api/dogs/${dog._id}/adopt`)
			.set('Authorization', `Bearer ${adopterToken}`)
			.send({ thankYouMessage: 'Thanks!' });

		const res = await chai
			.request(app)
			.post(`/api/dogs/${dog._id}/adopt`)
			.set('Authorization', `Bearer ${secondAdopterToken}`)
			.send({ thankYouMessage: 'Me too!' });

		expect(res).to.have.status(400);
	});

	it('rejects adopting a dog the user registered themselves', async () => {
		const ownerToken = await registerAndLogin(app, 'owner1');
		const dog = await registerDog(app, ownerToken);

		const res = await chai
			.request(app)
			.post(`/api/dogs/${dog._id}/adopt`)
			.set('Authorization', `Bearer ${ownerToken}`)
			.send({ thankYouMessage: 'Thanks me!' });

		expect(res).to.have.status(403);
	});

	it('returns 404 for a non-existent dog id', async () => {
		const adopterToken = await registerAndLogin(app, 'adopter1');
		const fakeId = '64b8f0f0f0f0f0f0f0f0f0f0';

		const res = await chai
			.request(app)
			.post(`/api/dogs/${fakeId}/adopt`)
			.set('Authorization', `Bearer ${adopterToken}`)
			.send({ thankYouMessage: 'Thanks!' });

		expect(res).to.have.status(404);
	});

	it('returns 400 for a malformed dog id', async () => {
		const adopterToken = await registerAndLogin(app, 'adopter1');

		const res = await chai
			.request(app)
			.post('/api/dogs/not-a-valid-id/adopt')
			.set('Authorization', `Bearer ${adopterToken}`)
			.send({ thankYouMessage: 'Thanks!' });

		expect(res).to.have.status(400);
	});
});
