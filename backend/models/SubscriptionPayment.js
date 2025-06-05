// models/SubscriptionPayment.js
const mongoose = require('mongoose');

const subscriptionPaymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  subscriptionId: {
    type: String, 
    required: true,
    unique: true,
  },
  priceId: {
    type: String,   
    required: true,
  },
  status: {
    type: String,   
    enum: ['active', 'canceled', 'incomplete', 'past_due'],
    default: 'active',
    required: true,
  },
  currentPeriodEnd: {
    type: Date,      
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true,
  versionKey: false,
});

module.exports = mongoose.model('SubscriptionPayment', subscriptionPaymentSchema);
