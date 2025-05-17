const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const amenitySchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  icon: {
    type: String,
  }
}, { timestamps: true });

module.exports = mongoose.model('Amenity', amenitySchema);