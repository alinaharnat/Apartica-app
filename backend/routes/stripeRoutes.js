const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/user');

router.post('/create-subscription-session', async (req, res) => {
  const { userId } = req.body;

  console.log('Creating subscription session for userId:', userId);

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: userId.toString() },
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
      console.log('Created Stripe customer:', customerId, 'for user:', userId);
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: customerId,
      line_items: [
        {
          price: 'price_1RVcJEQ3er1qnLFn7jOBn4Iv',
          quantity: 1,
        },
      ],
      metadata: { userId: userId.toString() },
      success_url: 'http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://localhost:5173/cancel',
    });

    console.log('Subscription session created:', session.id, 'with userId:', userId);

    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe session creation failed:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

router.get('/checkout-session', async (req, res) => {
  const sessionId = req.query.session_id;

  console.log('Retrieving checkout session:', sessionId);

  if (!sessionId) {
    return res.status(400).json({ error: 'session_id is required' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Перевіряємо, чи сесія завершена і є підписка
    if (session.payment_status === 'paid' && session.subscription) {
      const userId = session.metadata?.userId;

      if (!userId) {
        console.error('No userId found in session metadata:', sessionId);
        return res.status(400).json({ error: 'Missing userId in session metadata' });
      }

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        console.error('Invalid userId format:', userId);
        return res.status(400).json({ error: 'Invalid userId format' });
      }

      const user = await User.findById(userId);
      if (!user) {
        console.error('User not found for userId:', userId);
        return res.status(404).json({ error: 'User not found' });
      }

      console.log('User found:', {
        userId,
        email: user.email,
        currentUserType: user.userType,
      });

      if (!user.userType.includes('RentalAgency')) {
        user.userType.push('RentalAgency');
        user.stripeSubscriptionId = session.subscription;
        await user.save();
        console.log(`User ${userId} updated with RentalAgency status and subscription ID: ${session.subscription}`);
      } else {
        console.log(`User ${userId} already has RentalAgency status`);
        if (user.stripeSubscriptionId !== session.subscription) {
          user.stripeSubscriptionId = session.subscription;
          await user.save();
          console.log(`User ${userId} subscription ID updated: ${session.subscription}`);
        }
      }
    } else {
      console.log('Session not paid or no subscription:', {
        sessionId,
        paymentStatus: session.payment_status,
        subscription: session.subscription,
      });
    }

    res.json(session);
  } catch (error) {
    console.error('Error retrieving Stripe session:', error.message, error.stack);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;