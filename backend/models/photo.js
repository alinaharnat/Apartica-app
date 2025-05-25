// models/Photo.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const photoSchema = new Schema({
  url: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    trim: true,
  },
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: 'Property',
  },
  roomId: {
    type: Schema.Types.ObjectId,
    ref: 'Room',
  },
}, { timestamps: true });

photoSchema.index({ propertyId: 1 });
photoSchema.index({ roomId: 1 });

photoSchema.pre('save', function(next) {
  if (this.propertyId && this.roomId) {
    next(new Error('Photo cannot be linked to both a Property and a Room simultaneously.'));
  } else if (!this.propertyId && !this.roomId) {
    next(new Error('Photo must be linked to either a Property or a Room.'));
  } else {
    next();
  }
});

module.exports = mongoose.models.Photo || mongoose.model('Photo', photoSchema);
