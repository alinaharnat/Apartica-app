const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cancellationPolicySchema = new Schema({
  rules: [{
    _id: false,
    daysBeforeCheckIn: {
      type: Number,
      required: true,
    },
    refundPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
  }],
  isCustom: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('CancellationPolicy', cancellationPolicySchema);