const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    facebookId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, unique: true, sparse: true },
    profilePicture: { type: String },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema,'user');
module.exports = User;
