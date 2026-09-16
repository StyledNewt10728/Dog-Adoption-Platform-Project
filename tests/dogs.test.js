const chai = require('chai');
const chaiHttp = require('chai-http');
const { expect } = chai;
const { startTestServer, stopTestServer, clearDatabase, registerAndLogin } = require('./testServer');

chai.use(chaiHttp);

describe('Dogs', () => {
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

	it('rejects requests without a token', async () => {
		const res = await chai.request(app).post('/api/dogs').send({ name: 'Rex', description: 'Friendly dog' });
		expect(res).to.have.status(401);
	});

	it('registers a dog for the authenticated user', async () => {
		const token = await registerAndLogin(app, 'owner1');

		const res = await chai
			.request(app)
			.post('/api/dogs')
			.set('Authorization', `Bearer ${token}`)
			.send({ name: 'Rex', description: 'Friendly dog' });

		expect(res).to.have.status(201);
		expect(res.body).to.include({ name: 'Rex', description: 'Friendly dog', status: 'available' });
	});

	it('rejects a dog registration missing a description', async () => {
		const token = await registerAndLogin(app, 'owner1');

		const res = await chai
			.request(app)
			.post('/api/dogs')
			.set('Authorization', `Bearer ${token}`)
			.send({ name: 'Rex' });

		expect(res).to.have.status(400);
	});

	describe('listing and pagination', () => {
		it('filters registered dogs by status and paginates results', async () => {
			const token = await registerAndLogin(app, 'owner1');
			const adopterToken = await registerAndLogin(app, 'adopter1');

			for (let i = 0; i < 3; i += 1) {
				await chai
					.request(app)
					.post('/api/dogs')
					.set('Authorization', `Bearer ${token}`)
					.send({ name: `Dog${i}`, description: 'desc' });
			}

			const listRes = await chai
				.request(app)
				.get('/api/dogs/registered')
				.set('Authorization', `Bearer ${token}`)
				.query({ page: 1, limit: 2 });

			expect(listRes).to.have.status(200);
			expect(listRes.body.dogs).to.have.lengthOf(2);
			expect(listRes.body.total).to.equal(3);
			expect(listRes.body.totalPages).to.equal(2);

			const firstDogId = listRes.body.dogs[0]._id;
			await chai
				.request(app)
				.post(`/api/dogs/${firstDogId}/adopt`)
				.set('Authorization', `Bearer ${adopterToken}`)
				.send({ thankYouMessage: 'Thank you!' });

			const adoptedRes = await chai
				.request(app)
				.get('/api/dogs/registered')
				.set('Authorization', `Bearer ${token}`)
				.query({ status: 'adopted' });

			expect(adoptedRes).to.have.status(200);
			expect(adoptedRes.body.dogs).to.have.lengthOf(1);
			expect(adoptedRes.body.dogs[0]._id).to.equal(firstDogId);
		});

		it('lists dogs adopted by the current user', async () => {
			const ownerToken = await registerAndLogin(app, 'owner1');
			const adopterToken = await registerAndLogin(app, 'adopter1');

			const createRes = await chai
				.request(app)
				.post('/api/dogs')
				.set('Authorization', `Bearer ${ownerToken}`)
				.send({ name: 'Rex', description: 'Friendly dog' });

			await chai
				.request(app)
				.post(`/api/dogs/${createRes.body._id}/adopt`)
				.set('Authorization', `Bearer ${adopterToken}`)
				.send({ thankYouMessage: 'Thanks!' });

			const res = await chai
				.request(app)
				.get('/api/dogs/adopted')
				.set('Authorization', `Bearer ${adopterToken}`);

			expect(res).to.have.status(200);
			expect(res.body.dogs).to.have.lengthOf(1);
			expect(res.body.dogs[0].name).to.equal('Rex');
		});
	});

	describe('DELETE /api/dogs/:id', () => {
		it('allows the owner to remove an unadopted dog', async () => {
			const token = await registerAndLogin(app, 'owner1');
			const createRes = await chai
				.request(app)
				.post('/api/dogs')
				.set('Authorization', `Bearer ${token}`)
				.send({ name: 'Rex', description: 'Friendly dog' });

			const res = await chai
				.request(app)
				.delete(`/api/dogs/${createRes.body._id}`)
				.set('Authorization', `Bearer ${token}`);

			expect(res).to.have.status(200);
		});

		it('forbids removing a dog registered by another user', async () => {
			const ownerToken = await registerAndLogin(app, 'owner1');
			const otherToken = await registerAndLogin(app, 'other1');
			const createRes = await chai
				.request(app)
				.post('/api/dogs')
				.set('Authorization', `Bearer ${ownerToken}`)
				.send({ name: 'Rex', description: 'Friendly dog' });

			const res = await chai
				.request(app)
				.delete(`/api/dogs/${createRes.body._id}`)
				.set('Authorization', `Bearer ${otherToken}`);

			expect(res).to.have.status(403);
		});

		it('forbids removing a dog that has already been adopted', async () => {
			const ownerToken = await registerAndLogin(app, 'owner1');
			const adopterToken = await registerAndLogin(app, 'adopter1');
			const createRes = await chai
				.request(app)
				.post('/api/dogs')
				.set('Authorization', `Bearer ${ownerToken}`)
				.send({ name: 'Rex', description: 'Friendly dog' });

			await chai
				.request(app)
				.post(`/api/dogs/${createRes.body._id}/adopt`)
				.set('Authorization', `Bearer ${adopterToken}`)
				.send({ thankYouMessage: 'Thanks!' });

			const res = await chai
				.request(app)
				.delete(`/api/dogs/${createRes.body._id}`)
				.set('Authorization', `Bearer ${ownerToken}`);

			expect(res).to.have.status(400);
		});
	});
});
