const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
	username: { type: String, required: true, unique: true, trim: true },
	passwordHash: { type: String, required: true },
});

const dogSchema = new Schema(
	{
		name: { type: String, required: true, trim: true },
		description: { type: String, required: true, trim: true },
		owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		status: { type: String, enum: ['available', 'adopted'], default: 'available' },
		adopter: { type: Schema.Types.ObjectId, ref: 'User', default: null },
		thankYouMessage: { type: String, default: null },
	},
	{ timestamps: true }
);

// Speeds up the owner/adopter listing queries (with and without a status filter).
dogSchema.index({ owner: 1, status: 1 });
dogSchema.index({ adopter: 1 });

const User = mongoose.model('User', userSchema);
const Dog = mongoose.model('Dog', dogSchema);

module.exports = { User, Dog };
