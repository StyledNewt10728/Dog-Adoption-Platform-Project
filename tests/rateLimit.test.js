const chai = require('chai');
const chaiHttp = require('chai-http');
const { expect } = chai;
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { createApp } = require('../app');

chai.use(chaiHttp);

describe('Rate limiting', () => {
	let app;
	let mongoServer;

	before(async () => {
		process.env.NODE_ENV = 'development';
		process.env.JWT_SECRET = 'test_secret';

		mongoServer = await MongoMemoryServer.create();
		await mongoose.connect(mongoServer.getUri(), { dbName: 'test' });
		app = createApp();
	});

	after(async () => {
		await mongoose.disconnect();
		await mongoServer.stop();
		process.env.NODE_ENV = 'test';
	});

	it('returns 429 once the auth rate limit is exceeded', async () => {
		let lastRes;
		for (let i = 0; i < 21; i += 1) {
			lastRes = await chai
				.request(app)
				.post('/api/auth/login')
				.send({ username: 'nobody', password: 'nopass' });
		}

		expect(lastRes).to.have.status(429);
	});
});
