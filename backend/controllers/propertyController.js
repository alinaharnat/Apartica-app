const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Property = require('../models/property');
const Room = require('../models/room');
const Photo = require('../models/photo');
const City = require('../models/city');
const Country = require('../models/country');
const PropertyType = require('../models/propertyType');
const User = require('../models/user');
const Amenity = require('../models/amenity');
const HouseRuleOption = require('../models/houseRuleOption');
const HouseRuleCategory = require('../models/houseRuleCategory');
const Booking = require('../models/booking');
const Review = require('../models/review');
const CancellationPolicy = require('../models/cancellationPolicy');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios'); // Додаємо axios для Unsplash API

// @desc    Get data for property creation form (amenities, property types, house rules)
// @route   GET /api/properties/form-data
// @access  Private (PropertyOwner)
const getFormData = asyncHandler(async (req, res) => {

  try {
    const amenities = await Amenity.find().select('name icon') || [];

    const propertyTypes = await PropertyType.find().select('name') || [];

    const houseRuleOptions = await HouseRuleOption.find()
      .populate('categoryId', 'name')
      .select('value categoryId');


    const houseRulesMap = {};

    houseRuleOptions.forEach(option => {
      const category = option.categoryId;
      if (!category) return;

      const categoryName = category.name;
      if (!houseRulesMap[categoryName]) {
        houseRulesMap[categoryName] = {
          category: categoryName,
          options: [],
        };
      }

      houseRulesMap[categoryName].options.push({
        id: option._id.toString(),
        label: option.value,
      });
    });

    const houseRules = Object.values(houseRulesMap);

    res.status(200).json({
      amenities,
      propertyTypes,
      houseRules,
    });
  } catch (error) {
    console.error('getFormData error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Налаштування multer для збереження файлів
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath;
    if (file.fieldname.startsWith('room_')) {
      uploadPath = path.join(__dirname, '../public/room_photos');
    } else {
      uploadPath = path.join(__dirname, '../public/property_photos');
    }
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // Максимум 5MB на файл
});

const createPropertyWithRooms = asyncHandler(async (req, res) => {

  const {
    title, // Тепер це title, а не headline
    description,
    country,
    city,
    address,
    location,
    amenities,
    houseRules,
    propertyType,
    cancellationPolicy,
    rooms,
  } = req.body;

  if (!title || !description || !address || !location || !location.latitude || !location.longitude) {
    res.status(400);
    throw new Error('Title, description, address, and location coordinates are required');
  }

  // Перевірка, чи передано country
  if (!country) {
    res.status(400);
    throw new Error('Country is required');
  }

  // Пошук або створення країни
  let countryDoc = await Country.findOne({ name: country });
  if (!countryDoc) {
    countryDoc = await Country.create({ name: country });
  }

  // Перевірка, чи країна створена
  if (!countryDoc || !countryDoc._id) {
    res.status(500);
    throw new Error('Failed to create or find country');
  }

  // Пошук або створення міста
  let cityDoc = await City.findOne({ name: city, countryId: countryDoc._id });
  let isNewCity = false;
  if (!cityDoc) {
    isNewCity = true;
    cityDoc = await City.create({ name: city, countryId: countryDoc._id });
  }

  // Перевірка, чи місто створено
  if (!cityDoc || !cityDoc._id) {
    res.status(500);
    throw new Error('Failed to create or find city');
  }

  // Додавання фото для нового міста через Unsplash API
  if (isNewCity) {
    try {
      const response = await axios.get('https://api.unsplash.com/search/photos', {
        params: {
          query: city,
          per_page: 1,
          orientation: 'landscape',
        },
        headers: {
          Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
        },
      });

      if (response.data.results.length > 0) {
        cityDoc.imageUrl = response.data.results[0].urls.regular;
        await cityDoc.save();
      }
    } catch (error) {
      console.error(`Failed to fetch photo for city ${city} from Unsplash:`, error.message);
    }
  }

  // Додавання ролі PropertyOwner користувачу
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  if (!user.userType.includes('PropertyOwner')) {
    user.userType.push('PropertyOwner');
    await user.save();
  }

  // Обробка CancellationPolicy
  const policyData = JSON.parse(cancellationPolicy);
  let cancellationPolicyDoc = await CancellationPolicy.findOne({
    rules: policyData.rules,
    isCustom: policyData.isCustom,
  });
  if (!cancellationPolicyDoc) {
    cancellationPolicyDoc = await CancellationPolicy.create({
      rules: policyData.rules,
      isCustom: policyData.isCustom,
    });
  }

  // Перевірка, чи створена політика скасування
  if (!cancellationPolicyDoc || !cancellationPolicyDoc._id) {
    res.status(500);
    throw new Error('Failed to create or find cancellation policy');
  }

  // Створення Property
  const property = await Property.create({
    title,
    description,
    address,
    location: {
      latitude: location.latitude,
      longitude: location.longitude,
    },
    cityId: cityDoc._id,
    ownerId: req.user._id,
    amenities: JSON.parse(amenities),
    rules: JSON.parse(houseRules),
    propertyType,
    cancellationPolicyId: cancellationPolicyDoc._id,
    averageRating: 0,
    isListed: true,
  });

  // Створення Rooms
  const roomsData = JSON.parse(rooms);
  const createdRooms = [];
  for (const room of roomsData) {
    const newRoom = await Room.create({
      propertyId: property._id,
      bedrooms: room.numBedrooms,
      bathrooms: room.numBathrooms,
      maxGuests: room.maxGuests,
      pricePerNight: room.pricePerNight,
    });
    createdRooms.push(newRoom);
  }

  const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
  // Збереження фото для Property
  const propertyPhotos = req.files.photos || [];
  const photosToSave = [];
  for (const photo of propertyPhotos) {
    const photoPath = `${BASE_URL}/property_photos/${photo.filename}`;
    await Photo.create({
      url: photoPath,
      propertyId: property._id,
    });
    photosToSave.push(photoPath);
  }

  // Збереження фото для Rooms
  const roomPhotos = req.files.room_photos || [];
  const photosByRoomIndex = {};
  for (const photo of roomPhotos) {
    const [roomIndex] = photo.originalname.split('_'); // Отримуємо індекс із імені файлу
    const index = parseInt(roomIndex);
    if (!photosByRoomIndex[index]) {
      photosByRoomIndex[index] = [];
    }
    photosByRoomIndex[index].push(photo);
  }

  for (let i = 0; i < createdRooms.length; i++) {
    const photosForRoom = photosByRoomIndex[i] || [];
    for (const photo of photosForRoom) {
      const photoPath = `${BASE_URL}/room_photos/${photo.filename}`;
      await Photo.create({
        url: photoPath,
        roomId: createdRooms[i]._id,
      });
    }
  }

  // Оновлення CancellationPolicy з propertyId
  cancellationPolicyDoc.propertyId = property._id;
  await cancellationPolicyDoc.save();

  res.status(201).json({
    success: true,
    data: {
      property,
      rooms: createdRooms,
      photos: photosToSave,
    },
  });
});

// @desc Get all properties
const getProperties = asyncHandler(async (req, res) => {
  const properties = await Property.find({ isListed: true })
    .populate('cityId', 'name')
    .populate('propertyType', 'name')
    .populate('amenities', 'name')
    .populate({ path: 'rules', populate: { path: 'categoryId', model: 'HouseRuleCategory' } })
    .populate('ownerId', 'firstName lastName');

  res.status(200).json(properties);
});

// @desc Get property by ID with additional data
const getPropertyById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const property = await Property.findById(id)
      .populate({
        path: 'cityId',
        populate: { path: 'countryId', model: 'Country' },
      })
      .populate('propertyType')
      .populate('amenities')
      .populate({
        path: 'rules',
        model: 'HouseRuleOption',
        populate: { path: 'categoryId', model: 'HouseRuleCategory' },
      })
      .populate('ownerId', 'firstName lastName email');

    if (!property) {
      res.status(404);
      throw new Error('Property not found');
    }

    const rooms = await Room.find({ propertyId: property._id });
    const propertyPhotos = await Photo.find({ propertyId: property._id });
    const reviews = await Review.find({ propertyId: id })
      .populate('userId', 'displayName')
      .select('userId comment overallRating createdAt');

    const roomsWithPhotos = await Promise.all(
      rooms.map(async (room) => {
        const roomPhotos = await Photo.find({ roomId: room._id });
        return { ...room.toObject(), photos: roomPhotos };
      })
    );

    res.json({
      _id: property._id,
      title: property.title,
      description: property.description,
      address: property.address,
      location: property.location,
      city: {
        name: property.cityId?.name,
        country: property.cityId?.countryId ? { name: property.cityId.countryId.name } : null,
      },
      propertyType: property.propertyType || null,
      averageRating: property.averageRating,
      amenities: (property.amenities || []).filter(Boolean),
      rules: (property.rules || []).filter(Boolean).map(rule => ({
        _id: rule._id,
        value: rule.value,
        category: rule.categoryId ? { _id: rule.categoryId._id, name: rule.categoryId.name } : null,
      })),
      owner: property.ownerId || null,
      photos: propertyPhotos.map(p => ({ url: p.url, filename: p.filename })),
      rooms: roomsWithPhotos.map(r => ({
        _id: r._id,
        bedrooms: r.bedrooms,
        bathrooms: r.bathrooms,
        maxGuests: r.maxGuests,
        pricePerNight: r.pricePerNight,
        photos: r.photos.map(p => ({ url: p.url, filename: p.filename })),
      })),
      reviews: reviews.map(review => ({
        _id: review._id,
        userId: review.userId._id,
        userDisplayName: review.userId.displayName || 'Anonymous',
        comment: review.comment,
        rating: review.overallRating,
        createdAt: review.createdAt,
      })),
    });
  } catch (error) {
    console.error('getPropertyById error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// @desc Get available rooms based on dates and guests
const getAvailableRooms = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { startDate, endDate, guests } = req.query;

  if (!startDate || !endDate || !guests) {
    res.status(400);
    throw new Error('Missing startDate, endDate, or guests query parameters');
  }

  try {
    const property = await Property.findById(id);
    if (!property) {
      res.status(404);
      throw new Error('Property not found');
    }

    const rooms = await Room.find({ propertyId: id, maxGuests: { $gte: parseInt(guests) } });
    const bookings = await Booking.find({
      roomId: { $in: rooms.map(room => room._id) },
      status: { $in: ['pending', 'confirmed'] },
      $or: [
        { checkIn: { $lte: new Date(endDate) }, checkOut: { $gte: new Date(startDate) } },
      ],
    });

    const unavailableRoomIds = bookings.map(booking => booking.roomId.toString());
    const availableRooms = rooms.filter(room => !unavailableRoomIds.includes(room._id.toString()));

    const roomsWithPhotos = await Promise.all(
      availableRooms.map(async (room) => {
        const roomPhotos = await Photo.find({ roomId: room._id });
        return { ...room.toObject(), photos: roomPhotos };
      })
    );

    res.json(roomsWithPhotos);
  } catch (error) {
    console.error('getAvailableRooms error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// @desc Get unavailable dates for a property
const getUnavailableDates = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const property = await Property.findById(id);
    if (!property) {
      res.status(404);
      throw new Error('Property not found');
    }

    const rooms = await Room.find({ propertyId: id });
    const bookings = await Booking.find({
      roomId: { $in: rooms.map(room => room._id) },
      status: { $in: ['pending', 'confirmed'] },
    }).select('checkIn checkOut');

    const unavailableDates = bookings.reduce((acc, booking) => {
      const start = new Date(booking.checkIn);
      const end = new Date(booking.checkOut);
      for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
        acc.add(d.toISOString().split('T')[0]);
      }
      return acc;
    }, new Set());

    res.json(Array.from(unavailableDates));
  } catch (error) {
    console.error('getUnavailableDates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = {
  createPropertyWithRooms: [
    upload.fields([
      { name: 'photos', maxCount: 20 },
      { name: 'room_photos', maxCount: 100 }, // Максимум 100 фото для всіх кімнат (10 кімнат * 10 фото)
    ]),
    createPropertyWithRooms,
  ],
  getProperties,
  getPropertyById,
  getAvailableRooms,
  getUnavailableDates,
  getFormData,
};