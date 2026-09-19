const express = require('express');
const {register, login} = require('../controllers/requests');
const {authLimiter} = require('../middleware/rate_limiting');

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);

module.exports = router;