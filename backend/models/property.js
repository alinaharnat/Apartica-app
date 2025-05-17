// models/Property.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const propertySchema = new Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
  },
  location: {
    latitude: { type: Number },
    longitude: { type: Number },
  },
  cityId: {
    type: Schema.Types.ObjectId,
    ref: 'City',
    required: true,
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amenities: [{
    type: Schema.Types.ObjectId,
    ref: 'Amenity',
  }],
  rules: [{
    type: Schema.Types.ObjectId,
    ref: 'HouseRuleOption',
  }],
  propertyTypes: [{
    type: Schema.Types.ObjectId,
    ref: 'PropertyType',
  }],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 10,
  },
  isListed: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

propertySchema.index({ cityId: 1 });
propertySchema.index({ ownerId: 1 });
propertySchema.index({ title: 'text', description: 'text', address: 'text' });

module.exports = mongoose.model('Property', propertySchema);
