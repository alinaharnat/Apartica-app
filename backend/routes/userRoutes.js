const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/user');

router.get('/renters', protect, async (req, res) => {
  try {
    const renters = await User.find({ userType: 'Renter' })
      .select('-password -emailVerificationToken -emailVerificationTokenExpires');
    res.json(renters);
  } catch (err) {
    console.error('GET /renters error:', err);
    res.status(500).json({ message: 'Error fetching renters' });
  }
});

router.get('/me', protect, (req, res) => {
  res.json(req.user);
});

router.patch('/me', protect, async (req, res) => {
  try {
    const updates = req.body;
    Object.assign(req.user, updates);
    const updatedUser = await req.user.save();
    res.json(updatedUser);
  } catch (err) {
    console.error('PATCH /me error:', err);
    res.status(500).json({ message: 'Error updating user' });
  }
});

module.exports = router;
