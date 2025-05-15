const express = require('express');
const passport = require('passport');
const router = express.Router();
const {
  registerUser,
  emailLogin,
  verifyEmail,
  googleCallback
} = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/email-login', emailLogin);
router.post('/verify-email', verifyEmail);

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