const express = require('express');
const {
	registerDog,
	adoptDog,
	removeDog,
	listRegisteredDogs,
	listAdoptedDogs,
} = require('../controllers/dogController');
const { authenticate } = require('../middlewares/authentication');

const router = express.Router();

router.use(authenticate);

router.post('/', registerDog);
router.get('/registered', listRegisteredDogs);
router.get('/adopted', listAdoptedDogs);
router.post('/:id/adopt', adoptDog);
router.delete('/:id', removeDog);

module.exports = router;
