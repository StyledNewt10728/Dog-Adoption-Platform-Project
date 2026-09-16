process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';

const chai = require('chai');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { createApp } = require('../app');

let mongoServer;

async function startTestServer() {
	mongoServer = await MongoMemoryServer.create();
	await mongoose.connect(mongoServer.getUri(), { dbName: 'test' });
	return createApp();
}

async function stopTestServer() {
	await mongoose.disconnect();
	if (mongoServer) {
		await mongoServer.stop();
	}
}

async function clearDatabase() {
	const { collections } = mongoose.connection;
	await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
}

async function registerAndLogin(app, username, password = 'password123') {
	await chai.request(app).post('/api/auth/register').send({ username, password });
	const res = await chai.request(app).post('/api/auth/login').send({ username, password });
	return res.body.token;
}

module.exports = { startTestServer, stopTestServer, clearDatabase, registerAndLogin };
