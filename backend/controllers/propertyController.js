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

// @desc    Create a new property with rooms and photos
// @route   POST /api/properties
// @access  Private (PropertyOwner)
const createPropertyWithRooms = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    countryName,
    cityName,
    address,
    latitude,
    longitude,
    propertyTypeName,
    amenityIds: amenityIdsString,
    ruleOptionIds: ruleOptionIdsString,
    checkInTime,
    checkOutTime,
  } = req.body;

  console.log('Received data:', {
    title,
    countryName,
    cityName,
    propertyTypeName,
    roomsCount: Object.keys(req.body).filter(key => key.startsWith('rooms[')).length / 4
  });

  const ownerId = req.user._id;

  // Add PropertyOwner role if user doesn't have it
  if (!req.user.userType.includes('PropertyOwner')) {
    await User.findByIdAndUpdate(ownerId, {
      $addToSet: { userType: 'PropertyOwner' }
    });
  }

  const owner = await User.findById(ownerId);
  if (!owner) {
    res.status(404);
    throw new Error('Owner not found');
  }

  let amenityIds = [];
  let ruleOptionIds = [];
  const roomsData = [];

  try {
    if (amenityIdsString) amenityIds = JSON.parse(amenityIdsString);
    if (ruleOptionIdsString) ruleOptionIds = JSON.parse(ruleOptionIdsString);

    let roomIndex = 0;
    while (req.body[`rooms[${roomIndex}][bedrooms]`] !== undefined) {
      roomsData.push({
        bedrooms: parseInt(req.body[`rooms[${roomIndex}][bedrooms]`], 10),
        bathrooms: parseInt(req.body[`rooms[${roomIndex}][bathrooms]`], 10),
        maxGuests: parseInt(req.body[`rooms[${roomIndex}][maxGuests]`], 10),
        pricePerNight: parseFloat(req.body[`rooms[${roomIndex}][pricePerNight]`]),
      });
      roomIndex++;
    }
  } catch (e) {
    res.status(400);
    throw new Error('Invalid JSON data for amenities, rules, or rooms.');
  }

  if (!title || !description || !countryName || !cityName || !address || !propertyTypeName || roomsData.length === 0) {
    res.status(400);
    throw new Error('Please fill all required property fields and add at least one room.');
  }

  const countryDoc = await Country.findOne({ name: countryName });
  if (!countryDoc) throw new Error(`Country '${countryName}' not found.`);

  const cityDoc = await City.findOne({ name: cityName, countryId: countryDoc._id });
  if (!cityDoc) throw new Error(`City '${cityName}' in country '${countryName}' not found.`);

  const propertyTypeDoc = await PropertyType.findOne({ name: propertyTypeName });
  if (!propertyTypeDoc) throw new Error(`Property type '${propertyTypeName}' not found.`);

  // Validate amenities exist
  if (amenityIds.length > 0) {
    const validAmenities = await Amenity.find({ _id: { $in: amenityIds } });
    if (validAmenities.length !== amenityIds.length) {
      res.status(400);
      throw new Error('Some amenities are invalid');
    }
  }

  // Handle check-in/check-out times as house rules
  const checkInCategory = await HouseRuleCategory.findOne({ name: 'Check-in/Check-out' });
  if (!checkInCategory) {
    res.status(404);
    throw new Error('Check-in/Check-out category not found');
  }

  let checkInRule = await HouseRuleOption.findOne({ 
    categoryId: checkInCategory._id, 
    value: `Check-in: ${checkInTime}` 
  });
  if (!checkInRule) {
    checkInRule = await HouseRuleOption.create({
      categoryId: checkInCategory._id,
      value: `Check-in: ${checkInTime}`
    });
  }

  let checkOutRule = await HouseRuleOption.findOne({ 
    categoryId: checkInCategory._id, 
    value: `Check-out: ${checkOutTime}` 
  });
  if (!checkOutRule) {
    checkOutRule = await HouseRuleOption.create({
      categoryId: checkInCategory._id,
      value: `Check-out: ${checkOutTime}`
    });
  }

  const allRuleIds = [...ruleOptionIds, checkInRule._id, checkOutRule._id];

  const property = new Property({
    title,
    description,
    address,
    location: { 
      latitude: parseFloat(latitude) || 0, 
      longitude: parseFloat(longitude) || 0 
    },
    cityId: cityDoc._id,
    ownerId,
    amenities: amenityIds,
    rules: allRuleIds,
    propertyType: propertyTypeDoc._id,
    isListed: true,
  });

  const createdProperty = await property.save();

  if (req.files && req.files.propertyPhotos) {
    for (const file of req.files.propertyPhotos) {
      const photo = new Photo({
        url: `/Uploads/property_photos/${file.filename}`,
        filename: file.filename,
        propertyId: createdProperty._id,
      });
      await photo.save();
    }
  }

  for (let i = 0; i < roomsData.length; i++) {
    const roomData = roomsData[i];
    const room = new Room({
      propertyId: createdProperty._id,
      bedrooms: roomData.bedrooms,
      bathrooms: roomData.bathrooms,
      maxGuests: roomData.maxGuests,
      pricePerNight: roomData.pricePerNight,
    });
    const savedRoom = await room.save();

    const roomPhotoFieldName = `room_${i}_photos`;
    if (req.files && req.files[roomPhotoFieldName]) {
      for (const file of req.files[roomPhotoFieldName]) {
        const photo = new Photo({
          url: `/Uploads/room_photos/${file.filename}`,
          filename: file.filename,
          roomId: savedRoom._id,
        });
        await photo.save();
      }
    }
  }

  res.status(201).json({
    message: 'Property and rooms created successfully!',
    propertyId: createdProperty._id,
  });
});

// @desc Get all properties
// @route GET /api/properties
const getProperties = asyncHandler(async (req, res) => {
  const { limit, minPrice, maxPrice, minRating, city, type, amenities, guests, checkIn, checkOut } = req.query;
  try {
    const filter = { isListed: true };

    // City filter
    if (city) {
      const cityDoc = await City.findOne({ name: city });
      if (!cityDoc) {
        console.log(`City '${city}' not found`);
        return res.status(200).json([]);
      }
      filter.cityId = cityDoc._id;
    }

    // Property type filter
    if (type) {
      const propertyTypes = type.split(',');
      const typeDocs = await PropertyType.find({ name: { $in: propertyTypes } });
      console.log('PropertyType docs:', typeDocs);
      if (typeDocs.length > 0) {
        filter.propertyType = { $in: typeDocs.map(doc => doc._id) };
      } else {
        console.log(`No PropertyType found for: ${propertyTypes.join(', ')}`);
        return res.status(200).json([]);
      }
    }

    // Amenities filter
    if (amenities) {
      const amenityNames = amenities.split(',');
      const amenityDocs = await Amenity.find({ name: { $in: amenityNames } });
      console.log('Amenity docs:', amenityDocs);
      if (amenityDocs.length > 0) {
        filter.amenities = { $all: amenityDocs.map(doc => doc._id) };
      }
    }

    // Rating filter
    if (minRating) {
      filter.averageRating = { $gte: parseFloat(minRating) };
    }

    // Fetch properties
    let propertiesData = await Property.find(filter)
      .populate({
        path: 'cityId',
        populate: { path: 'countryId' }
      })
      .populate('propertyType', 'name')
      .populate('amenities', 'name')
      .populate({ path: 'rules', populate: { path: 'categoryId', model: 'HouseRuleCategory' } })
      .populate('ownerId', 'firstName lastName')
      .limit(parseInt(limit) || 10);

    // Filter by rooms and availability
    propertiesData = await Promise.all(
      propertiesData.map(async (property) => {
        const roomFilter = { propertyId: property._id };
        if (guests) roomFilter.maxGuests = { $gte: parseInt(guests) };
        if (minPrice || maxPrice) {
          roomFilter.pricePerNight = {};
          if (minPrice) roomFilter.pricePerNight.$gte = parseInt(minPrice);
          if (maxPrice) roomFilter.pricePerNight.$lte = parseInt(maxPrice);
        }

        const rooms = await Room.find(roomFilter);
        if (rooms.length === 0) {
          console.log(`No rooms found for property ${property._id}`);
          return null;
        }

        const pricePerNight = Math.min(...rooms.map(room => room.pricePerNight));

        if (checkIn && checkOut) {
          const startDate = new Date(checkIn);
          const endDate = new Date(checkOut);
          if (isNaN(startDate) || isNaN(endDate)) {
            console.log(`Invalid dates for property ${property._id}: checkIn=${checkIn}, checkOut=${checkOut}`);
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
            console.log(`No available rooms for property ${property._id} on dates ${checkIn} to ${checkOut}`);
            return null;
          }
        }

        // Fetch photos separately via /api/photos
        const photos = await Photo.find({ propertyId: property._id }).select('url filename').limit(5);
        return { ...property.toJSON(), pricePerNight, photos };
      })
    ).then(results => results.filter(property => property !== null));

    console.log('Filtered properties:', propertiesData.length);
    res.status(200).json(propertiesData); // Changed to 200 (not 201, as this is a GET)
  } catch (err) {
    console.error('Error fetching properties:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @desc Get property by ID with additional data
// @route GET /api/properties/:id
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
        userId: review.userId?._id || null,
        userDisplayName: review.userId?.displayName || (review.userId ? `${review.userId.firstName || ''} ${review.userId.lastName || ''}`.trim() : 'Anonymous'),
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
// @route GET /api/properties/:id/available-rooms
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
// @route GET /api/properties/:id/unavailable-dates
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
  createPropertyWithRooms,
  getProperties,
  getPropertyById,
  getAvailableRooms,
  getUnavailableDates,
};