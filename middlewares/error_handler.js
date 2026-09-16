function notFound(req, res) {
	res.status(404).json({ error: 'Route not found' });
}

// Centralizes translation of Mongoose/MongoDB error shapes into HTTP status codes so
// controllers can just `next(err)` instead of duplicating this mapping everywhere.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
	if (err.name === 'ValidationError') {
		return res.status(400).json({ error: err.message });
	}
	if (err.name === 'CastError') {
		return res.status(400).json({ error: 'Invalid id format' });
	}
	if (err.code === 11000) {
		return res.status(409).json({ error: 'Resource already exists' });
	}

	console.error(err);
	res.status(500).json({ error: 'Internal server error' });
}

module.exports = { notFound, errorHandler };
