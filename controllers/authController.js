const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models/data_model');

const TOKEN_TTL = '24h';
const SALT_ROUNDS = 10;

async function register(req, res, next) {
	try {
		const { username, password } = req.body;

		if (!username || !password) {
			return res.status(400).json({ error: 'username and password are required' });
		}

		const existing = await User.findOne({ username });
		if (existing) {
			return res.status(409).json({ error: 'Username is already taken' });
		}
		
		const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
		const user = await User.create({ username, passwordHash });

		res.status(201).json({ id: user._id, username: user.username });
	} catch (err) {
		next(err);
	}
}

async function login(req, res, next) {
	try {
		const { username, password } = req.body;

		if (!username || !password) {
			return res.status(400).json({ error: 'username and password are required' });
		}

		// Same error message and status for "no such user" and "wrong password" so a
		// caller can't use this endpoint to enumerate registered usernames.
		const user = await User.findOne({ username });
		if (!user) {
			return res.status(401).json({ error: 'Invalid username or password' });
		}

		const passwordMatches = await bcrypt.compare(password, user.passwordHash);
		if (!passwordMatches) {
			return res.status(401).json({ error: 'Invalid username or password' });
		}

		const token = jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, {
			expiresIn: TOKEN_TTL,
		});

		res.status(200).json({ token });
	} catch (err) {
		next(err);
	}
}

module.exports = { register, login };
