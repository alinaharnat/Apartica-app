const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  type: { type: String, required: true },
  price: { type: Number, required: true },
  capacity: { type: Number, required: true },
  availableDates: [{ type: Date, required: true }],
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  area: { type: Number },
  amenities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Amenity' }]
}, { timestamps: true });


module.exports = mongoose.model('Room', roomSchema);
