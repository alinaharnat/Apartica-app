// models/Room.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const roomSchema = new Schema({
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
  },
  bedrooms: {
    type: Number,
    required: true,
    min: 0,
  },
  bathrooms: {
    type: Number,
    required: true,
    min: 0,
  },
  maxGuests: {
    type: Number,
    required: true,
    min: 1,
  },
  pricePerNight: {
    type: Number,
    required: true,
    min: 0,
  },
}, { timestamps: true });

roomSchema.index({ propertyId: 1 });

module.exports = mongoose.model('Room', roomSchema);
