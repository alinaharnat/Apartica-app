// models/user.js
const mongoose = require('mongoose');

const userSchema = mongoose.Schema(
  {
    userId: {
      type: Number,
      required: true,
      unique: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    name: {
      type: String,
      required: true
    },
    phoneNumber: {
      type: String,
      required: true
    },
    profilePicture: {
      type: String
    },
    isBlocked: {
      type: Boolean,
      default: false
    },
    userType: {
      type: String,
      enum: ['Renter', 'PropertyOwner', 'Administrator', 'Moderator'],
      default: 'Renter'
    },
    googleId: {
      type: String,
      sparse: true, // Дозволяє null, але унікальні значення
    },
    emailVerificationToken: {
      type: String,
    },
    emailVerificationTokenExpires: {
      type: Date,
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    discriminatorKey: 'userType'
  }
);

const User = mongoose.model('User', userSchema);

module.exports = User;