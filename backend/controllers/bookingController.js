const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Booking = require('../models/booking');
const Payment = require('../models/payment');
const Room = require('../models/room');
const User = require('../models/user');
const Property = require('../models/property'); // Додаємо модель Property
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { sendBookingConfirmationEmail } = require('../config/email'); // Імпортуємо новий метод

// @desc Create a booking and initiate payment
// @route POST /booking/create
// @access Private
const createBookingWithPayment = asyncHandler(async (req, res) => {
  try {
    const {
      propertyId,
      roomId,
      startDate,
      endDate,
      guests,
      totalPrice,
      guestFullName,
      paymentMethod,
      userDetails,
    } = req.body;

    const renterId = req.user?._id;

    // Перевірка наявності всіх обов’язкових полів
    if (!renterId || !propertyId || !roomId || !startDate || !endDate || !guests || !totalPrice || !guestFullName || !paymentMethod) {
      res.status(400);
    }

    // Перевірка наявності email і phoneNumber
    if (!userDetails?.email || !userDetails?.phoneNumber) {
      res.status(400);
    }
    const room = await Room.findById(roomId);
    if (!room) {
      res.status(404);
    }

    // Перевірка, чи є активні бронювання на ці дати
    const start = new Date(startDate);
    const end = new Date(endDate);
    const existingBookings = await Booking.find({
      roomId: roomId,
      status: { $in: ['pending', 'confirmed'] }, // Враховуємо бронювання зі статусами 'pending' або 'confirmed'
      $or: [
        { checkIn: { $lte: end }, checkOut: { $gte: start } }, // Перетинаються дати
      ],
    });

    if (existingBookings.length > 0) {
      res.status(400);
    }

    // Створення сесії оплати через Stripe з усіма даними в метадатах
    if (paymentMethod === 'stripe') {
      const successUrl = `${req.protocol}://${req.get('host')}/api/booking/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${req.protocol}://${req.get('host')}/api/booking/cancel?session_id={CHECKOUT_SESSION_ID}`;

      // Перевірка коректності totalPrice
      const unitAmount = Math.round(totalPrice * 100);
      if (isNaN(unitAmount) || unitAmount <= 0) {
        res.status(400);
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: `Booking for ${propertyId} - Room ${roomId}`,
              },
              unit_amount: unitAmount, // Stripe очікує суму в центах
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        customer_email: userDetails.email,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          renterId: renterId.toString(),
          propertyId,
          roomId,
          startDate,
          endDate,
          guests: guests.toString(),
          totalPrice: totalPrice.toString(),
          guestFullName,
          guestEmail: userDetails.email,
          guestPhoneNumber: userDetails.phoneNumber,
          guestName: userDetails.name || '',
        },
      });

      // Створення платежу без bookingId
      const payment = new Payment({
        amount: totalPrice,
        paymentMethod: 'stripe',
        transactionId: session.id,
        status: 'pending',
      });

      await payment.save();

      res.json({ sessionId: session.id, url: session.url });
    } else {
      res.status(400);
    }
  } catch (error) {
    console.error('Error in createBookingWithPayment:', error.message, error.stack);
    res.status(500);
  }
});

// @desc Handle Stripe payment success
// @route GET /booking/success
// @access Public
const handlePaymentSuccess = asyncHandler(async (req, res) => {
  try {
    const { session_id } = req.query;

    if (!session_id) {
      res.status(400);
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === 'paid') {
      const payment = await Payment.findOne({ transactionId: session.id });
      if (!payment) {
        res.status(404);
      }

      // Створення бронювання
      const booking = new Booking({
        roomId: session.metadata.roomId,
        renterId: session.metadata.renterId,
        checkIn: new Date(session.metadata.startDate),
        checkOut: new Date(session.metadata.endDate),
        totalPrice: parseFloat(session.metadata.totalPrice),
        status: 'pending',
        numberOfGuests: parseInt(session.metadata.guests),
        guestFullName: session.metadata.guestFullName,
        guestEmail: session.metadata.guestEmail,
        guestPhoneNumber: session.metadata.guestPhoneNumber,
      });

      const savedBooking = await booking.save();

      // Оновлення Payment з bookingId і status одночасно
      payment.bookingId = savedBooking._id;
      payment.status = 'completed';
      await payment.save();

      // Отримуємо поточного користувача для порівняння email
      const user = await User.findById(session.metadata.renterId);
      if (!user) {
        res.status(404);
      }

      // Оновлюємо дані користувача лише якщо email збігається або не змінюється
      const newEmail = session.metadata.guestEmail;
      if (!user.email || user.email.toLowerCase() === newEmail.toLowerCase()) {
        await User.findByIdAndUpdate(session.metadata.renterId, {
          name: session.metadata.guestName,
          email: newEmail,
          phoneNumber: session.metadata.guestPhoneNumber,
        });
      } else {
        // Оновлюємо лише name і phoneNumber, якщо email не збігається
        await User.findByIdAndUpdate(session.metadata.renterId, {
          name: session.metadata.guestName,
          phoneNumber: session.metadata.guestPhoneNumber,
        });
      }

      // Отримуємо назву помешкання
      const property = await Property.findById(session.metadata.propertyId);
      if (!property) {
        res.status(404);
      }

      // Надсилаємо лист про успішне бронювання
      try {
        await sendBookingConfirmationEmail(
          session.metadata.guestEmail,
          session.metadata.guestFullName,
          property.title
        );
      } catch (emailError) {
        console.error('Failed to send booking confirmation email:', emailError.message);
      }

      res.redirect('http://localhost:5173/payment-status?status=success');
    } else {
      res.status(400);
    }
  } catch (error) {
    console.error('Error in handlePaymentSuccess:', error.message, error.stack);
    res.status(500);
  }
});

// @desc Handle Stripe payment cancellation
// @route GET /booking/cancel
// @access Public
const handlePaymentCancel = asyncHandler(async (req, res) => {
  try {
    const { session_id } = req.query;

    if (!session_id) {
      res.status(400);
    }

    // Знаходимо платіж за session_id
    const payment = await Payment.findOne({ transactionId: session_id });
    if (!payment) {
      res.status(404);
    }

    // Оновлюємо статус платежу на 'failed'
    payment.status = 'failed';
    await payment.save();

    res.redirect('http://localhost:5173/booking?payment=cancelled');
  } catch (error) {
    console.error('Error in handlePaymentCancel:', error.message, error.stack);
    res.status(500);
  }
});

module.exports = {
  createBookingWithPayment,
  handlePaymentSuccess,
  handlePaymentCancel,
};