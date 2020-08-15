const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const postSchema = new Schema({
    content: String,
    tags: Array,
    likes: Number,
    postAuthor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    createdAt: Date,
    modifiedAt: Date,
});

module.exports = mongoose.model('Post', postSchema);
