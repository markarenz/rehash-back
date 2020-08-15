const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const alertSchema = new Schema({
    alertUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    alertType: String,
    alertMessage: String,
    alertLinkType: String,
    alertLinkId: String,
    isRead: Boolean,
    createdAt: Date,
});

module.exports = mongoose.model('Alert', alertSchema);
