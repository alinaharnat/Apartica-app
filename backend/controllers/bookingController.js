const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Booking = require('../models/booking');
const Payment = require('../models/payment');
const Room = require('../models/room');
const User = require('../models/user');
const Property = require('../models/property');
const CancellationPolicy = require('../models/cancellationPolicy');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { sendBookingConfirmationEmail, sendBookingCancellationEmail } = require('../config/email');

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
        status: 'confirmed',
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
      throw new Error('Session ID is required');
    }

    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['payment_intent'], // Розширюємо, щоб отримати payment_intent
    });

    if (session.payment_status === 'paid') {
      const payment = await Payment.findOne({ transactionId: session_id });
      if (!payment) {
        res.status(404);
        throw new Error('Payment not found');
      }

      // Оновлюємо transactionId на payment_intent ID
      payment.transactionId = session.payment_intent.id;
      payment.status = 'completed';

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

      payment.bookingId = savedBooking._id;
      await payment.save();

      const user = await User.findById(session.metadata.renterId);
      if (!user) {
        res.status(404);
        throw new Error('User not found');
      }

      const newEmail = session.metadata.guestEmail;
      if (!user.email || user.email.toLowerCase() === newEmail.toLowerCase()) {
        await User.findByIdAndUpdate(session.metadata.renterId, {
          name: session.metadata.guestName,
          email: newEmail,
          phoneNumber: session.metadata.guestPhoneNumber,
        });
      } else {
        await User.findByIdAndUpdate(session.metadata.renterId, {
          name: session.metadata.guestName,
          phoneNumber: session.metadata.guestPhoneNumber,
        });
      }

      const property = await Property.findById(session.metadata.propertyId);
      if (!property) {
        res.status(404);
        throw new Error('Property not found');
      }

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
      throw new Error('Payment not completed');
    }
  } catch (error) {
    console.error('Error in handlePaymentSuccess:', error.message, error.stack);
    res.status(500);
    throw new Error('Server error');
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

// @desc Get all bookings for a user
// @route GET /booking/user
// @access Private
const getUserBookings = asyncHandler(async (req, res) => {
  try {
    const renterId = req.user?._id;

    if (!renterId) {
      res.status(401);
      throw new Error('User not authenticated');
    }

    const bookings = await Booking.find({ renterId })
      .populate({
        path: 'roomId',
        select: 'propertyId',
        populate: {
          path: 'propertyId',
          select: 'title address cityId',
          populate: {
            path: 'cityId',
            select: 'name',
          },
        },
      })
      .lean();

    const currentBookings = bookings.filter(
      (booking) => booking.status === 'pending' || booking.status === 'confirmed'
    );
    const pastBookings = bookings.filter(
      (booking) => !['pending', 'confirmed'].includes(booking.status)
    );

    res.json({
      currentBookings,
      pastBookings,
    });
  } catch (error) {
    console.error('Error in getUserBookings:', error.message, error.stack);
    res.status(500);
    throw new Error('Server error');
  }
});

const cancelBooking = asyncHandler(async (req, res) => {
  try {
    const { bookingId } = req.params;
    const renterId = req.user?._id;

    if (!bookingId || !renterId) {
      res.status(400);
      throw new Error('Booking ID and user authentication required');
    }

    // Знаходимо бронювання
    const booking = await Booking.findById(bookingId).populate({
      path: 'roomId',
      select: 'propertyId',
      populate: {
        path: 'propertyId',
        select: 'title cancellationPolicyId',
        populate: {
          path: 'cancellationPolicyId',
          select: 'rules',
        },
      },
    });

    if (!booking) {
      res.status(404);
      throw new Error('Booking not found');
    }

    if (booking.renterId.toString() !== renterId.toString()) {
      res.status(403);
      throw new Error('Not authorized to cancel this booking');
    }

    if (booking.status !== 'pending' && booking.status !== 'confirmed') {
      res.status(400);
      throw new Error('Only pending or confirmed bookings can be cancelled');
    }

    // Знаходимо платіж
    const payment = await Payment.findOne({ bookingId, status: 'completed' });
    if (!payment) {
      res.status(404);
      throw new Error('Payment not found or not completed');
    }

    // Обчислюємо кількість днів до checkIn
    const today = new Date();
    const checkIn = new Date(booking.checkIn);
    const timeDiff = checkIn - today;
    const daysBeforeCheckIn = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    // Отримуємо політику скасування
    const cancellationPolicy = booking.roomId?.propertyId?.cancellationPolicyId;
    if (!cancellationPolicy || !cancellationPolicy.rules) {
      res.status(400);
      throw new Error('Cancellation policy not found');
    }

    // Знаходимо відповідне правило скасування
    let refundPercentage = 0;
    for (const rule of cancellationPolicy.rules) {
      if (daysBeforeCheckIn >= rule.daysBeforeCheckIn) {
        refundPercentage = rule.refundPercentage;
        break;
      }
    }

    // Обчислюємо суму повернення
    const refundAmount = (payment.amount * refundPercentage) / 100;

    // Виконуємо повернення через Stripe
    if (refundAmount > 0) {
      try {
        const refund = await stripe.refunds.create({
          payment_intent: payment.transactionId,
          amount: Math.round(refundAmount * 100), // Stripe очікує суму в центах
        });

        // Оновлюємо статус платежу
        payment.status = 'refunded';
        payment.amount = refundAmount; // Оновлюємо суму, якщо часткове повернення
        await payment.save();
      } catch (stripeError) {
        console.error('Stripe refund error:', stripeError.message);
        res.status(500);
        throw new Error('Failed to process refund');
      }
    } else {
      // Якщо повернення 0%, просто оновлюємо статус платежу
      payment.status = 'refunded';
      await payment.save();
    }

    // Оновлюємо статус бронювання
    booking.status = 'cancelled_by_renter';
    await booking.save();

    // Надсилаємо email про скасування
    try {
      await sendBookingCancellationEmail(
        booking.guestEmail,
        booking.guestFullName,
        booking.roomId.propertyId.title,
        refundAmount
      );
    } catch (emailError) {
      console.error('Failed to send cancellation email:', emailError.message);
      // Не перериваємо виконання, якщо email не надіслано
    }

    res.json({ message: 'Booking cancelled successfully', refundAmount });
  } catch (error) {
    console.error('Error in cancelBooking:', error.message, error.stack);
    res.status(error.status || 500);
    throw new Error(error.message || 'Server error');
  }
});

const getRefundAmount = asyncHandler(async (req, res) => {
  try {
    const { bookingId } = req.params;
    const renterId = req.user?._id;

    if (!bookingId || !renterId) {
      res.status(400);
      throw new Error('Booking ID and user authentication required');
    }

    const booking = await Booking.findById(bookingId).populate({
      path: 'roomId',
      select: 'propertyId',
      populate: {
        path: 'propertyId',
        select: 'cancellationPolicyId',
        populate: {
          path: 'cancellationPolicyId',
          select: 'rules',
        },
      },
    });

    if (!booking) {
      res.status(404);
      throw new Error('Booking not found');
    }

    if (booking.renterId.toString() !== renterId.toString()) {
      res.status(403);
      throw new Error('Not authorized to view this booking');
    }

    if (booking.status !== 'pending' && booking.status !== 'confirmed') {
      res.status(400);
      throw new Error('Only pending or confirmed bookings can be cancelled');
    }

    const payment = await Payment.findOne({ bookingId, status: 'completed' });
    if (!payment) {
      res.status(404);
      throw new Error('Payment not found or not completed');
    }

    const today = new Date();
    const checkIn = new Date(booking.checkIn);
    const timeDiff = checkIn - today;
    const daysBeforeCheckIn = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    const cancellationPolicy = booking.roomId?.propertyId?.cancellationPolicyId;
    if (!cancellationPolicy || !cancellationPolicy.rules) {
      res.status(400);
      throw new Error('Cancellation policy not found');
    }

    let refundPercentage = 0;
    for (const rule of cancellationPolicy.rules) {
      if (daysBeforeCheckIn >= rule.daysBeforeCheckIn) {
        refundPercentage = rule.refundPercentage;
        break;
      }
    }

    const refundAmount = (payment.amount * refundPercentage) / 100;

    res.json({ refundAmount });
  } catch (error) {
    console.error('Error in getRefundAmount:', error.message, error.stack);
    res.status(error.status || 500);
    throw new Error(error.message || 'Server error');
  }
});

module.exports = {
  createBookingWithPayment,
  handlePaymentSuccess,
  handlePaymentCancel,
  getUserBookings,
  cancelBooking,
  getRefundAmount,
};