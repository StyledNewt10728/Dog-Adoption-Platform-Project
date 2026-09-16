const mongoose = require('mongoose');
const { Dog } = require('../models/data_model');

// Clamp limit to 100 so a caller can't force an unbounded collection scan/response.
function parsePagination(query) {
	const page = Math.max(parseInt(query.page, 10) || 1, 1);
	const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
	return { page, limit, skip: (page - 1) * limit };
}

function isValidId(id) {
	return mongoose.Types.ObjectId.isValid(id);
}

async function registerDog(req, res, next) {
	try {
		const { name, description } = req.body;

		if (!name || !description) {
			return res.status(400).json({ error: 'name and description are required' });
		}

		const dog = await Dog.create({ name, description, owner: req.userId });
		res.status(201).json(dog);
	} catch (err) {
		next(err);
	}
}

async function adoptDog(req, res, next) {
	try {
		const { id } = req.params;
		const { thankYouMessage } = req.body;

		if (!isValidId(id)) {
			return res.status(400).json({ error: 'Invalid dog id' });
		}

		const dog = await Dog.findById(id);
		if (!dog) {
			return res.status(404).json({ error: 'Dog not found' });
		}

		// Adoption status is checked before ownership so the response reflects the dog's
		// actual state (already adopted) rather than an unrelated ownership rule.
		if (dog.status === 'adopted') {
			return res.status(400).json({ error: 'Dog has already been adopted' });
		}

		if (dog.owner.toString() === req.userId) {
			return res.status(403).json({ error: 'You cannot adopt a dog you registered' });
		}

		dog.status = 'adopted';
		dog.adopter = req.userId;
		dog.thankYouMessage = thankYouMessage || '';
		await dog.save();

		res.status(200).json(dog);
	} catch (err) {
		next(err);
	}
}

async function removeDog(req, res, next) {
	try {
		const { id } = req.params;

		if (!isValidId(id)) {
			return res.status(400).json({ error: 'Invalid dog id' });
		}

		const dog = await Dog.findById(id);
		if (!dog) {
			return res.status(404).json({ error: 'Dog not found' });
		}

		if (dog.owner.toString() !== req.userId) {
			return res.status(403).json({ error: 'You cannot remove a dog registered by someone else' });
		}

		if (dog.status === 'adopted') {
			return res.status(400).json({ error: 'An adopted dog cannot be removed' });
		}

		await dog.deleteOne();
		res.status(200).json({ message: 'Dog removed' });
	} catch (err) {
		next(err);
	}
}

async function listRegisteredDogs(req, res, next) {
	try {
		const { status } = req.query;
		const { page, limit, skip } = parsePagination(req.query);

		if (status && !['available', 'adopted'].includes(status)) {
			return res.status(400).json({ error: "status must be 'available' or 'adopted'" });
		}

		const filter = { owner: req.userId };
		if (status) {
			filter.status = status;
		}

		const [dogs, total] = await Promise.all([
			Dog.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
			Dog.countDocuments(filter),
		]);

		res.status(200).json({ dogs, page, limit, total, totalPages: Math.ceil(total / limit) });
	} catch (err) {
		next(err);
	}
}

async function listAdoptedDogs(req, res, next) {
	try {
		const { page, limit, skip } = parsePagination(req.query);
		const filter = { adopter: req.userId };

		const [dogs, total] = await Promise.all([
			Dog.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
			Dog.countDocuments(filter),
		]);

		res.status(200).json({ dogs, page, limit, total, totalPages: Math.ceil(total / limit) });
	} catch (err) {
		next(err);
	}
}

module.exports = { registerDog, adoptDog, removeDog, listRegisteredDogs, listAdoptedDogs };
