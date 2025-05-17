// models/Review.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reviewSchema = new Schema({
  bookingId: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
  },
  comment: {
    type: String,
    trim: true,
  },
  overallRating: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
  },
}, { timestamps: true });

reviewSchema.index({ propertyId: 1 });
reviewSchema.index({ userId: 1 });
reviewSchema.index({ bookingId: 1 });

reviewSchema.post('save', async function() {
  await this.constructor.updateAverageRating(this.propertyId);
});

reviewSchema.post('remove', async function() {
  await this.constructor.updateAverageRating(this.propertyId);
});

reviewSchema.statics.updateAverageRating = async function(propertyId) {
  const Property = mongoose.model('Property');
  const reviews = await this.find({ propertyId });
  if (reviews.length > 0) {
    const totalRating = reviews.reduce((acc, item) => acc + item.overallRating, 0);
    const average = totalRating / reviews.length;
    await Property.findByIdAndUpdate(propertyId, { averageRating: average.toFixed(1) });
  } else {
    await Property.findByIdAndUpdate(propertyId, { averageRating: 0 });
  }
};

module.exports = mongoose.model('Review', reviewSchema);
