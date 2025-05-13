const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  url: { type: String, required: true },
  description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Photo', photoSchema);
