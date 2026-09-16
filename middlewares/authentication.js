const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
	const authHeader = req.headers.authorization || '';
	const [scheme, token] = authHeader.split(' ');

	if (scheme !== 'Bearer' || !token) {
		res.set('WWW-Authenticate', 'Bearer');
		return res.status(401).json({ error: 'Missing or malformed Authorization header' });
	}

	try {
		const payload = jwt.verify(token, process.env.JWT_SECRET);
		req.userId = payload.sub;
		next();
	} catch (err) {
		res.set('WWW-Authenticate', 'Bearer error="invalid_token"');
		return res.status(401).json({ error: 'Invalid or expired token' });
	}
}

module.exports = { authenticate };
