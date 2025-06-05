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
      required: [true, 'Будь ласка, вкажіть вашу електронну пошту'], // Повідомлення про помилку валідації
      unique: true,
      trim: true, // Видаляє пробіли на початку та в кінці
      lowercase: true, // Зберігає email в нижньому регістрі
      match: [ // Валідація формату email
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Будь ласка, вкажіть дійсну електронну пошту',
      ],
    },
    name: {
      type: String,
      required: true
    },
    displayName: {
      type: String // <-- нове поле (може дублювати name)
    },
    phoneNumber: {
      type: String
      // Більше не required — щоб Google-реєстрація працювала
    },
    isBlocked: {
      type: Boolean,
      default: false
    },
    userType: {
      type: [String], // Масив рядків
      enum: ['Renter', 'PropertyOwner', 'Administrator', 'Moderator'],
      default: ['Renter'],
      required: true,
    },
    googleId: {
      type: String,
      sparse: true
    },
    emailVerificationToken: {
      type: String
    },
    emailVerificationTokenExpires: {
      type: Date
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    dateOfBirth: {
      type: Date
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    }
  },
  {
    timestamps: true,
    discriminatorKey: 'userType'
  }
);

const User = mongoose.models.User || mongoose.model('User', userSchema);
module.exports = User;