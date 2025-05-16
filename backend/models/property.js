// models/Property.js
const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  address: { type: String, required: true },
  latitude: { type: Number },
  longitude: { type: Number },
  bedrooms: { type: Number, default: 1 },
  bathrooms: { type: Number, default: 1 },
  cityId: { type: mongoose.Schema.Types.ObjectId, ref: 'City', required: true },
  amenities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Amenity' }],
  photos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Photo' }],
  rooms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Room' }],
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  averageRating: { type: Number, default: 0.0 }
}, {
  timestamps: true
});

module.exports = mongoose.model('Property', propertySchema);
