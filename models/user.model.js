const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const userSchema = new Schema({
    // _id: ObjectId,
    auth0Id: String,
    name: {type: String, unique: true, index: true},
    email: {type: String, unique: true, index: true},
    active: Boolean,
    bio: String,
    avatar: String,
    level: Number,
    score: Number,
    numPosts: Number,
    numLikes: Number,
    numFollowers: Number,
    bonus: Number,
    tags: Array,
    slogan: Array,
    createdAt: Date,
    modifiedAt: Date,
});

module.exports = mongoose.model('User', userSchema);
