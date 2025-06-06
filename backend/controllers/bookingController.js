const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Booking = require('../models/booking');
const Payment = require('../models/payment');
const Room = require('../models/room');
const User = require('../models/user');
const Property = require('../models/property');
const CancellationPolicy = require('../models/cancellationPolicy');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { sendBookingConfirmationEmail, sendBookingCancellationEmail, sendBookingOwnerCancellationEmail, sendBookingOwnerConfirmationEmail } = require('../config/email');

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
      return res.status(400).json({ message: 'Missing required fields: renterId, propertyId, roomId, startDate, endDate, guests, totalPrice, guestFullName, or paymentMethod' });
    }

    // Перевірка наявності email і phoneNumber
    if (!userDetails?.email || !userDetails?.phoneNumber) {
      return res.status(400).json({ message: 'Missing user details: email and phoneNumber are required' });
    }

    // Перевірка існування кімнати
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Перевірка, чи є активні бронювання на ці дати
    const start = new Date(startDate);
    const end = new Date(endDate);
    const existingBookings = await Booking.find({
      roomId: roomId,
      status: { $in: ['pending', 'confirmed'] },
      $and: [
        { checkIn: { $lt: end } }, // checkIn < endDate
        { checkOut: { $gt: start } }, // checkOut > startDate
      ],
    });

    // Виключаємо бронювання, де checkIn дорівнює endDate, бо заїзд можливий після виїзду
    const conflictingBookings = existingBookings.filter(
      booking => !(booking.checkIn.getTime() === end.getTime())
    );

    if (conflictingBookings.length > 0) {
      return res.status(400).json({ message: 'Room is already booked for the selected dates' });
    }

    // Створення сесії оплати через Stripe
    if (paymentMethod === 'stripe') {
      const unitAmount = Math.round(totalPrice * 100);
      if (isNaN(unitAmount) || unitAmount <= 0) {
        return res.status(400).json({ message: 'Invalid totalPrice: must be a valid number greater than 0' });
      }

      const successUrl = `${req.protocol}://${req.get('host')}/api/booking/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${req.protocol}://${req.get('host')}/api/booking/cancel?session_id={CHECKOUT_SESSION_ID}`;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: `Booking for ${propertyId} - Room ${roomId}`,
              },
              unit_amount: unitAmount,
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
      return res.status(400).json({ message: 'Invalid payment method. Only "stripe" is supported' });
    }
  } catch (error) {
    console.error('Error in createBookingWithPayment:', error.message, error.stack);
    res.status(500).json({ message: 'Server error during booking creation', error: error.message });
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
      expand: ['payment_intent'],
    });

    if (session.payment_status === 'paid') {
      const payment = await Payment.findOne({ transactionId: session_id });
      if (!payment) {
        res.status(404);
        throw new Error('Payment not found');
      }

      payment.transactionId = session.payment_intent.id;
      payment.status = 'completed';

      const booking = new Booking({
        roomId: session.metadata.roomId,
        renterId: session.metadata.renterId,
        checkIn: new Date(session.metadata.startDate),
        checkOut: new Date(session.metadata.endDate),
        totalPrice: parseFloat(session.metadata.totalPrice),
        status: 'confirmed',
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

      const room = await Room.findById(session.metadata.roomId);
      if (!room) {
        res.status(404);
        throw new Error('Room not found');
      }

      const owner = await User.findById(property.ownerId);
      if (!owner) {
        res.status(404);
        throw new Error('Property owner not found');
      }

      try {
        await Promise.all([
          sendBookingConfirmationEmail(
            session.metadata.guestEmail,
            session.metadata.guestFullName,
            property.title
          ),
          sendBookingOwnerConfirmationEmail(
            owner?.email,
            property.title,
            session.metadata.startDate,
            session.metadata.endDate
          )
        ]);
      } catch (emailError) {
        console.error('Failed to send one or both confirmation emails:', emailError.message);
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
        select: 'propertyId bedrooms bathrooms',
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
    const { cancelBy } = req.body;
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
        select: 'title cancellationPolicyId ownerId',
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

    if (
      booking.renterId.toString() !== renterId.toString() &&
      booking.roomId?.propertyId?.ownerId.toString() !== renterId.toString()
    ) {
      res.status(403);
      throw new Error('Not authorized to cancel this booking');
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

    // Log payment details for debugging
    console.log('Payment details:', {
      paymentId: payment._id,
      transactionId: payment.transactionId,
      paymentMethod: payment.paymentMethod,
      amount: payment.amount,
    });

    // Verify payment method is Stripe
    if (payment.paymentMethod !== 'stripe') {
      res.status(400);
      throw new Error(`Refunds not supported for payment method: ${payment.paymentMethod}`);
    }

    // Verify transactionId exists
    if (!payment.transactionId) {
      res.status(400);
      throw new Error('No transaction ID found for this payment');
    }

    let paymentIntentId = payment.transactionId;

    // Check if transactionId is a Checkout Session ID (starts with 'cs_')
    if (payment.transactionId.startsWith('cs_')) {
      try {
        const session = await stripe.checkout.sessions.retrieve(payment.transactionId, {
          expand: ['payment_intent'],
        });
        if (!session.payment_intent) {
          res.status(400);
          throw new Error('No payment intent found for this checkout session');
        }
        paymentIntentId = session.payment_intent.id;
        console.log('Retrieved Payment Intent ID:', paymentIntentId);
      } catch (stripeError) {
        console.error('Error retrieving checkout session:', {
          message: stripeError.message,
          transactionId: payment.transactionId,
        });
        res.status(500);
        throw new Error('Failed to retrieve payment intent from checkout session');
      }
    }

    let refundAmount;
    let emailFunction;

    if (cancelBy === 'owner') {
      // Owner cancellation: refund full amount
      refundAmount = payment.amount;
      booking.status = 'cancelled_by_owner';
      emailFunction = sendBookingOwnerCancellationEmail;
    } else {
      // Renter cancellation: apply cancellation policy
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

      refundAmount = (payment.amount * refundPercentage) / 100;
      booking.status = 'cancelled_by_renter';
      emailFunction = sendBookingCancellationEmail;
    }

    if (refundAmount > 0) {
      try {
        const refund = await stripe.refunds.create({
          payment_intent: paymentIntentId,
          amount: Math.round(refundAmount * 100),
        });

        payment.status = 'refunded';
        payment.amount = refundAmount;
        await payment.save();
      } catch (stripeError) {
        console.error('Stripe refund error:', {
          message: stripeError.message,
          paymentIntentId,
        });
        res.status(500);
        throw new Error('Failed to process refund');
      }
    } else {
      payment.status = 'refunded';
      await payment.save();
    }

    await booking.save();

    try {
      await emailFunction(
        booking.guestEmail,
        booking.guestFullName,
        booking.roomId.propertyId.title,
        refundAmount
      );
    } catch (emailError) {
      console.error('Failed to send cancellation email:', emailError.message);
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
const getOwnerBookings = asyncHandler(async (req, res) => {
  try {
    const ownerId = req.user?._id;
    const { roomIds } = req.query;

    if (!ownerId) {
      res.status(401);
      throw new Error('User not authenticated');
    }

    if (!roomIds) {
      res.status(400);
      throw new Error('Room IDs are required');
    }

    const roomIdArray = roomIds.split(',').map(id => mongoose.Types.ObjectId(id));

    const bookings = await Booking.find({ roomId: { $in: roomIdArray } })
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
    console.error('Error in getOwnerBookings:', error.message, error.stack);
    res.status(500);
    throw new Error('Server error');
  }
});
const getBookingsByUserId = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findOne({ userId: parseInt(userId) });
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    const bookings = await Booking.find({ renterId: user._id })
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
    console.error('Error in getBookingsByUserId:', error.message, error.stack);
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
  getOwnerBookings,
  getBookingsByUserId,
};