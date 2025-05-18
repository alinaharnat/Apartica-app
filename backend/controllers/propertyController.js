// controllers/propertyController.js
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Property = require('../models/property');
const Room = require('../models/room');
const Photo = require('../models/photo');
const City = require('../models/city');
const Country = require('../models/country');
const PropertyType = require('../models/propertyType');

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
    propertyTypeName,
    amenityIds: amenityIdsString,
    ruleIds: ruleIdsString,
  } = req.body;

  const ownerId = req.user._id;

  if (!req.user.roles || !req.user.roles.includes('PropertyOwner')) {
    res.status(403);
    throw new Error('User is not authorized to list properties.');
  }

  let amenityIds = [];
  let ruleIds = [];
  const roomsData = [];

  try {
    if (amenityIdsString) amenityIds = JSON.parse(amenityIdsString);
    if (ruleIdsString) ruleIds = JSON.parse(ruleIdsString);

    let roomIndex = 0;
    while (req.body[`rooms[${roomIndex}][numBedrooms]`] !== undefined) {
      roomsData.push({
        numBedrooms: parseInt(req.body[`rooms[${roomIndex}][numBedrooms]`], 10),
        numBathrooms: parseInt(req.body[`rooms[${roomIndex}][numBathrooms]`], 10),
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

  for (const room of roomsData) {
    if (
      room.numBedrooms === undefined ||
      room.numBathrooms === undefined ||
      room.maxGuests === undefined ||
      room.pricePerNight === undefined
    ) {
      res.status(400);
      throw new Error('All rooms must have number of bedrooms, bathrooms, max guests, and price per night.');
    }
  }

  const countryDoc = await Country.findOne({ name: countryName });
  if (!countryDoc) {
    res.status(400);
    throw new Error(`Country '${countryName}' not found.`);
  }

  const cityDoc = await City.findOne({ name: cityName, countryId: countryDoc._id });
  if (!cityDoc) {
    res.status(400);
    throw new Error(`City '${cityName}' in country '${countryName}' not found.`);
  }

  const propertyTypeDoc = await PropertyType.findOne({ name: propertyTypeName });
  if (!propertyTypeDoc) {
    res.status(400);
    throw new Error(`Property type '${propertyTypeName}' not found.`);
  }

  const validAmenityIds = Array.isArray(amenityIds)
    ? amenityIds.filter(id => mongoose.Types.ObjectId.isValid(id))
    : [];
  const validRuleIds = Array.isArray(ruleIds)
    ? ruleIds.filter(id => mongoose.Types.ObjectId.isValid(id))
    : [];

  const property = new Property({
    title,
    description,
    address,
    cityId: cityDoc._id,
    ownerId,
    amenities: validAmenityIds,
    rules: validRuleIds,
    propertyType: propertyTypeDoc._id, // <=== зміна тут
    isListed: true,
  });

  const createdProperty = await property.save();

  if (req.files && req.files.propertyPhotos) {
    for (const file of req.files.propertyPhotos) {
      const photo = new Photo({
        url: `/uploads/property_photos/${file.filename}`,
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
      bedrooms: roomData.numBedrooms,
      bathrooms: roomData.numBathrooms,
      maxGuests: roomData.maxGuests,
      pricePerNight: roomData.pricePerNight,
    });
    const savedRoom = await room.save();

    const roomPhotoFieldName = `room_${i}_photos`;
    if (req.files && req.files[roomPhotoFieldName]) {
      for (const file of req.files[roomPhotoFieldName]) {
        const photo = new Photo({
          url: `/uploads/room_photos/${file.filename}`,
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

// @desc    Get all listed properties
// @route   GET /api/properties
// @access  Public
const getProperties = asyncHandler(async (req, res) => {
  const properties = await Property.find({ isListed: true })
    .populate('cityId', 'name')
    .populate('propertyType', 'name')
    .populate('amenities', 'name')
    .populate('rules', 'name');

  res.status(200).json(properties);
});

// @desc    Get property by ID
// @route   GET /api/properties/:id
// @access  Public
const getPropertyById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid property ID.');
  }

  const property = await Property.findById(id)
    .populate('cityId', 'name')
    .populate('propertyType', 'name')
    .populate('amenities', 'name')
    .populate('rules', 'name');

  if (!property) {
    res.status(404);
    throw new Error('Property not found.');
  }

  const rooms = await Room.find({ propertyId: id });
  const propertyPhotos = await Photo.find({ propertyId: id });
  const roomPhotos = await Photo.find({ roomId: { $in: rooms.map(r => r._id) } });

  res.status(200).json({
    ...property.toObject(),
    rooms,
    photos: propertyPhotos,
    roomPhotos,
  });
});

module.exports = {
  createPropertyWithRooms,
  getProperties,
  getPropertyById,
};
