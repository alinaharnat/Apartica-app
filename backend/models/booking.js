// models/Booking.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
  roomId: {
    type: Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
  },
  renterId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  checkIn: {
    type: Date,
    required: true,
  },
  checkOut: {
    type: Date,
    required: true,
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'confirmed', 'cancelled_by_renter', 'cancelled_by_owner', 'completed', 'failed'],
    default: 'pending',
  },
  numberOfGuests: {
    type: Number,
    required: true,
    min: 1,
  },
  guestFullName: {
    type: String,
    required: true,
  },
}, { timestamps: true });

bookingSchema.index({ propertyId: 1 });
bookingSchema.index({ renterId: 1 });
bookingSchema.index({ status: 1 });

bookingSchema.pre('save', function(next) {
  if (this.checkOut <= this.checkIn) {
    next(new Error('Check-out date must be after check-in date.'));
  } else {
    next();
  }
});

module.exports = mongoose.model('Booking', bookingSchema);
