const rateLimit = require('express-rate-limit');

// The test suite makes far more requests per run than these windows allow, so
// limiting is skipped under NODE_ENV=test (see tests/testServer.js).
const skip = () => process.env.NODE_ENV === 'test';

const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 20,
	standardHeaders: true,
	legacyHeaders: false,
	skip,
	message: { error: 'Too many attempts, please try again later' },
});

const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 300,
	standardHeaders: true,
	legacyHeaders: false,
	skip,
	message: { error: 'Too many requests, please try again later' },
});

module.exports = { authLimiter, apiLimiter };
