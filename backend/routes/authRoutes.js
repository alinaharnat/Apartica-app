const express = require('express');
const passport = require('passport');
const router = express.Router();
const {
  registerUser,
  emailLogin,
  verifyEmail,
  googleCallback,
  getCurrentUser,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/email-login', emailLogin);
router.post('/verify-email', verifyEmail);
router.get('/me', protect, getCurrentUser); // Ensure this route exists

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed`
  }),
  googleCallback
);

module.exports = router;