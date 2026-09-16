const mongoose = require('mongoose');

async function connectDB(uri = process.env.MONGODB_URI, dbName = process.env.DB_NAME) {
	if (!uri) {
		throw new Error('MONGODB_URI is not set');
	}

	await mongoose.connect(uri, { dbName });
	return mongoose.connection;
}

async function disconnectDB() {
	await mongoose.disconnect();
}

module.exports = { connectDB, disconnectDB };
