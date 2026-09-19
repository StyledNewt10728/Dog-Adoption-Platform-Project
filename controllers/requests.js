const bcrypt = require('bcrypt.js');
const jwt = require('jsonwebtoken');
const {User} = require('.../models/data_model');

const TOKEN_TTL = '24h';
const SALT_ROUNDS = 10;

async function register(req, res, next) {
    try {
        const {username, password} = req.body;

        if (!username || !password) {
            return res.status(400).json({error: 'username and password are required'});
        }

        const existing = await User.findOne({username});
        if(existing) {
            return res.status(409).json({error: 'Username is already taken'});
        }
        
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        const user = await User.create({username, passwordHash});

        res.status(201).json({id: user._id, username: user.username});
    } catch (err) {
        next(err);
    }
}
export default register;