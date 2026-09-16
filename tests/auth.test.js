const chai = require('chai');
const chaiHttp = require('chai-http');
const { expect } = chai;
const { startTestServer, stopTestServer, clearDatabase } = require('./testServer');

chai.use(chaiHttp);

describe('Auth', () => {
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

	describe('POST /api/auth/register', () => {
		it('registers a new user and does not return the password', async () => {
			const res = await chai
				.request(app)
				.post('/api/auth/register')
				.send({ username: 'alice', password: 'password123' });

			expect(res).to.have.status(201);
			expect(res.body).to.include({ username: 'alice' });
			expect(res.body).to.not.have.property('password');
			expect(res.body).to.not.have.property('passwordHash');
		});

		it('rejects a duplicate username', async () => {
			await chai.request(app).post('/api/auth/register').send({ username: 'alice', password: 'password123' });
			const res = await chai
				.request(app)
				.post('/api/auth/register')
				.send({ username: 'alice', password: 'anotherpass' });

			expect(res).to.have.status(409);
		});

		it('rejects a missing password', async () => {
			const res = await chai.request(app).post('/api/auth/register').send({ username: 'alice' });
			expect(res).to.have.status(400);
		});
	});

	describe('POST /api/auth/login', () => {
		beforeEach(async () => {
			await chai.request(app).post('/api/auth/register').send({ username: 'alice', password: 'password123' });
		});

		it('logs in with valid credentials and returns a token', async () => {
			const res = await chai
				.request(app)
				.post('/api/auth/login')
				.send({ username: 'alice', password: 'password123' });

			expect(res).to.have.status(200);
			expect(res.body).to.have.property('token').that.is.a('string');
		});

		it('rejects an invalid password', async () => {
			const res = await chai
				.request(app)
				.post('/api/auth/login')
				.send({ username: 'alice', password: 'wrongpass' });

			expect(res).to.have.status(401);
		});

		it('rejects an unknown username', async () => {
			const res = await chai
				.request(app)
				.post('/api/auth/login')
				.send({ username: 'bob', password: 'password123' });

			expect(res).to.have.status(401);
		});
	});
});
