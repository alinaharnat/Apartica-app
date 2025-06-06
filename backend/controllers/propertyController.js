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
const axios = require('axios');

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
    title,
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

  if (!country) {
    res.status(400);
    throw new Error('Country is required');
  }

  let countryDoc = await Country.findOne({ name: country });
  if (!countryDoc) {
    countryDoc = await Country.create({ name: country });
  }

  if (!countryDoc || !countryDoc._id) {
    res.status(500);
    throw new Error('Failed to create or find country');
  }

  let cityDoc = await City.findOne({ name: city, countryId: countryDoc._id });
  let isNewCity = false;
  if (!cityDoc) {
    isNewCity = true;
    cityDoc = await City.create({ name: city, countryId: countryDoc._id });
  }

  if (!cityDoc || !cityDoc._id) {
    res.status(500);
    throw new Error('Failed to create or find city');
  }

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

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  if (!user.userType.includes('PropertyOwner')) {
    user.userType.push('PropertyOwner');
    await user.save();
  }

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

  if (!cancellationPolicyDoc || !cancellationPolicyDoc._id) {
    res.status(500);
    throw new Error('Failed to create or find cancellation policy');
  }

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
    isListed: false,
  });

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

  const BASE_URL = process.env.BASE_URL || `${import.meta.env.VITE_API_URL}`;
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

  const roomPhotos = req.files.room_photos || [];
  const photosByRoomIndex = {};
  for (const photo of roomPhotos) {
    const [roomIndex] = photo.originalname.split('_');
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
  const {
    limit = 0, // 0 означает отсутствие лимита
    minPrice = 0,
    maxPrice,
    minRating = 0,
    city,
    type,
    amenities,
    guests,
    checkIn,
    checkOut,
    sort = '-positiveReviewCount', // По умолчанию сортировка по количеству положительных отзывов
  } = req.query;


  try {
    const filter = { isListed: true };

    // City filter
    if (city) {
      const cityDoc = await City.findOne({ name: city });
      if (!cityDoc) {
        return res.status(200).json([]);
      }
      filter.cityId = cityDoc._id;
    }

    // Property type filter
    if (type) {
      const propertyTypes = type.split(',');
      const typeDocs = await PropertyType.find({ name: { $in: propertyTypes } });
      if (typeDocs.length > 0) {
        filter.propertyType = { $in: typeDocs.map(doc => doc._id) };
      } else {
        return res.status(200).json([]);
      }
    }

    // Amenities filter
    if (amenities) {
      const amenityNames = amenities.split(',');
      const amenityDocs = await Amenity.find({ name: { $in: amenityNames } });
      if (amenityDocs.length > 0) {
        filter.amenities = { $all: amenityDocs.map(doc => doc._id) };
      } else {
        return res.status(200).json([]);
      }
    }

    // Rating filter
    if (minRating) {
      filter.averageRating = { $gte: parseFloat(minRating) };
    }

    // Подготовка сортировки
    const sortFields = {};
    const sortParams = sort.split(',').map(s => s.trim());
    sortParams.forEach(param => {
      const [field, order] = param.startsWith('-') ? [param.slice(1), -1] : [param, 1];
      if (['positiveReviewCount', 'averageRating', 'pricePerNight'].includes(field)) {
        sortFields[field] = order;
      }
    });

    // Агрегация для подсчета положительных отзывов

    // Aggregation pipeline
    const pipeline = [
      // Фильтрация по базовым условиям
      { $match: filter },
      // Присоединяем отзывы
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'propertyId',
          as: 'reviews',
        },
      },
      // Подсчет положительных отзывов (overallRating >= 8)
      {
        $addFields: {
          positiveReviewCount: {
            $size: {
              $filter: {
                input: '$reviews',
                as: 'review',
                cond: { $gte: ['$$review.overallRating', 8] },
              },
            },
          },
        },
      },
      // Фильтрация по минимальному рейтингу
      {
        $match: {
          $or: [
            { averageRating: { $gte: parseFloat(minRating) } },
            { averageRating: { $exists: false }, positiveReviewCount: { $gte: parseFloat(minRating) } },
          ],
        },
      },
      // Присоединяем данные о городе и стране
      {
        $lookup: {
          from: 'cities',
          localField: 'cityId',
          foreignField: '_id',
          as: 'cityId',
        },
      },
      { $unwind: { path: '$cityId', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'countries',
          localField: 'cityId.countryId',
          foreignField: '_id',
          as: 'countryId',
        },
      },
      { $unwind: { path: '$countryId', preserveNullAndEmptyArrays: true } },
      // Присоединяем тип недвижимости и удобства
      {
        $lookup: {
          from: 'propertytypes',
          localField: 'propertyType',
          foreignField: '_id',
          as: 'propertyType',
        },
      },
      { $unwind: { path: '$propertyType', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'amenities',
          localField: 'amenities',
          foreignField: '_id',
          as: 'amenities',
        },
      },
      // Сортировка
      { $sort: Object.keys(sortFields).length > 0 ? sortFields : { positiveReviewCount: -1, averageRating: -1 } },
      // Ограничение, если указано
      ...(limit > 0 ? [{ $limit: parseInt(limit) }] : []),
      // Формирование результата
      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          address: 1,
          location: 1,
          averageRating: 1,
          positiveReviewCount: 1,
          cityId: { _id: '$cityId._id', name: '$cityId.name' },
          countryId: { _id: '$countryId._id', name: '$countryId.name' },
          propertyType: { _id: '$propertyType._id', name: '$propertyType.name' },
          amenities: '$amenities.name',
        },
      },
    ];

    let properties = await Property.aggregate(pipeline);

    // Фильтрация по комнатам и доступности
    const propertiesData = await Promise.all(
      properties.map(async (property) => {
        const roomFilter = { propertyId: property._id };
        if (guests) roomFilter.maxGuests = { $gte: parseInt(guests) };
        if (minPrice || maxPrice) {
          roomFilter.pricePerNight = {};
          if (minPrice) roomFilter.pricePerNight.$gte = parseInt(minPrice);
          if (maxPrice) roomFilter.pricePerNight.$lte = parseInt(maxPrice);
        }

        const rooms = await Room.find(roomFilter);
        if (rooms.length === 0) {
          return null;
        }

        const pricePerNight = Math.min(...rooms.map(room => room.pricePerNight));

        if (checkIn && checkOut) {
          const startDate = new Date(checkIn);
          const endDate = new Date(checkOut);
          if (isNaN(startDate) || isNaN(endDate)) {
            return null;
          }
          const bookings = await Booking.find({
            roomId: { $in: rooms.map(room => room._id) },
            status: { $in: ['pending', 'confirmed'] },
            $or: [{ checkIn: { $lte: endDate }, checkOut: { $gte: startDate } }],
          });
          const unavailableRoomIds = bookings.map(booking => booking.roomId.toString());
          const availableRooms = rooms.filter(room => !unavailableRoomIds.includes(room._id.toString()));
          if (availableRooms.length === 0) {
            return null;
          }
        }

        // Fetch photos
        const photos = await Photo.find({ propertyId: property._id }).select('url filename').limit(5);
        return { ...property, pricePerNight, photos };
      })
    ).then(results => results.filter(property => property !== null));



    if (!propertiesData.length) {
      return res.status(200).json([]);
    }

    res.status(200).json(propertiesData);
  } catch (err) {
    console.error('Error fetching properties:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Остальные функции без изменений
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
      isListed: property.isListed,
    });
  } catch (error) {
    console.error('getPropertyById error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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

    // Знаходимо бронювання, які перетинаються з обраним періодом
    const bookings = await Booking.find({
      roomId: { $in: rooms.map(room => room._id) },
      status: { $in: ['pending', 'confirmed'] },
      $and: [
        { checkIn: { $lt: new Date(endDate) } }, // checkIn < endDate
        { checkOut: { $gt: new Date(startDate) } }, // checkOut > startDate
      ],
    });

    // Виключаємо бронювання, де checkIn дорівнює endDate
    const conflictingBookings = bookings.filter(
      booking => !(booking.checkIn.getTime() === new Date(endDate).getTime())
    );

    const unavailableRoomIds = conflictingBookings.map(booking => booking.roomId.toString());
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

// @desc Get properties owned by the user
const getPropertiesByOwner = asyncHandler(async (req, res) => {
  const { ownerId } = req.params;

  try {
    const properties = await Property.find({ ownerId })
      .populate('cityId')
      .populate('propertyType')
      .populate('amenities')
      .select('title description address cityId propertyType averageRating isListed');

    res.json(properties);
  } catch (error) {
    console.error('getPropertiesByOwner error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
const getRoomsByPropertyIds = asyncHandler(async (req, res) => {
  try {
    const { propertyIds } = req.query;

    if (!propertyIds) {
      res.status(400);
      throw new Error('Property IDs are required');
    }

    const propertyIdArray = propertyIds.split(',').map(id => mongoose.Types.ObjectId(id));

    const rooms = await Room.find({ propertyId: { $in: propertyIdArray } }).lean();

    res.json(rooms);
  } catch (error) {
    console.error('Error in getRoomsByPropertyIds:', error.message, error.stack);
    res.status(500);
    throw new Error('Server error');
  }
});

const deleteProperty = asyncHandler(async (req, res) => {
  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid property ID' });
    }

    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    if (property.ownerId.toString() !== req.user._id.toString() && !req.user.userType.includes('Administrator') && !req.user.userType.includes('Moderator')) {
      return res.status(403).json({ message: 'Unauthorized: You are not the owner of this property' });
    }

    // Find rooms associated with the property
    const rooms = await Room.find({ propertyId: property._id });
    const roomIds = rooms.map(room => room._id);

    // Check for pending or confirmed bookings
    const bookings = await Booking.find({
      roomId: { $in: roomIds },
      status: { $in: ['pending', 'confirmed'] },
    });

    if (bookings.length > 0) {
      // Set isListed to false instead of deleting
      property.isListed = false;
      await property.save();
      return res.status(200).json({
        message: 'Property has active bookings and cannot be deleted. It has been unlisted instead. \n Contact Apartica support to list it again, if you changed your mind.',
        isListed: false,
      });
    }

    // Delete photos associated with the property and its rooms
    await Photo.deleteMany({
      $or: [
        { propertyId: property._id },
        { roomId: { $in: roomIds } },
      ],
    });

    // Delete rooms
    await Room.deleteMany({ propertyId: property._id });

    // Delete the property
    await Property.deleteOne({ _id: property._id });

    res.json({ message: 'Property and all associated data deleted successfully' });
  } catch (error) {
    console.error('Error deleting property:', error.message, error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = {
  createPropertyWithRooms: [
    upload.fields([
      { name: 'photos', maxCount: 20 },
      { name: 'room_photos', maxCount: 100 },
    ]),
    createPropertyWithRooms,
  ],
  getProperties,
  getPropertyById,
  getAvailableRooms,
  getUnavailableDates,
  getFormData,
  getPropertiesByOwner,
  getRoomsByPropertyIds,
  deleteProperty,
};