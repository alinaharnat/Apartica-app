// controllers/propertyController.js
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Property = require('../models/property');
const Room = require('../models/room');
const Photo = require('../models/photo');
const City = require('../models/city');
const Country = require('../models/country');
const PropertyType = require('../models/propertyType');
// Amenity та HouseRuleOption будуть використовуватися для валідації ID

// @desc    Create a new property with rooms and photos
// @route   POST /api/properties/createWithRooms (або просто /api/properties, якщо це основний метод створення)
// @access  Private (PropertyOwner)
const createPropertyWithRooms = asyncHandler(async (req, res) => {
  const {
    title, // Раніше headline
    description,
    countryName,
    cityName,
    address,
    propertyTypeName, // Назва типу
    amenityIds: amenityIdsString, // JSON рядок масиву ID
    ruleIds: ruleIdsString,       // JSON рядок масиву ID
    rooms: roomsDataString,       // JSON рядок масиву даних про кімнати (без фото)
    // location: { latitude, longitude } // Якщо надсилається
  } = req.body;

  const ownerId = req.user._id;

  if (!req.user.roles || !req.user.roles.includes('PropertyOwner')) {
    res.status(403);
    throw new Error('User is not authorized to list properties.');
  }

  // Парсимо JSON рядки
  let amenityIds = [];
  let ruleIds = [];
  let roomsData = [];

  try {
    if (amenityIdsString) amenityIds = JSON.parse(amenityIdsString);
    if (ruleIdsString) ruleIds = JSON.parse(ruleIdsString);
    // Дані про кімнати (numBedrooms, numBathrooms, maxGuests, pricePerNight)
    // тепер надсилаються інакше з фронтенду (FormData), тому їх потрібно зібрати
    // Приклад: req.body['rooms[0][numBedrooms]']
    // Для простоти, припустимо, що фронтенд надсилає roomsData як JSON рядок,
    // АБО ми зберемо їх з req.body, якщо вони надходять як окремі поля.
    // Поточний фронтенд (add_property_page_multi_room_photos) надсилає їх як окремі поля.

    // Збираємо дані кімнат з req.body
    const parsedRoomsData = [];
    let roomIndex = 0;
    while (req.body[`rooms[${roomIndex}][numBedrooms]`] !== undefined) {
        parsedRoomsData.push({
            numBedrooms: parseInt(req.body[`rooms[${roomIndex}][numBedrooms]`], 10),
            numBathrooms: parseInt(req.body[`rooms[${roomIndex}][numBathrooms]`], 10),
            maxGuests: parseInt(req.body[`rooms[${roomIndex}][maxGuests]`], 10),
            pricePerNight: parseFloat(req.body[`rooms[${roomIndex}][pricePerNight]`]),
            // Тут можна додати інші поля для кімнати, якщо вони є
        });
        roomIndex++;
    }
    roomsData = parsedRoomsData;

  } catch (e) {
    res.status(400);
    throw new Error('Invalid JSON data for amenities, rules, or rooms.');
  }


  if (!title || !description || !countryName || !cityName || !address || !propertyTypeName || roomsData.length === 0) {
    res.status(400);
    throw new Error('Please fill all required property fields and add at least one room.');
  }
  for (const room of roomsData) {
    if (room.numBedrooms === undefined || room.numBathrooms === undefined || !room.maxGuests || !room.pricePerNight) {
        res.status(400);
        throw new Error('All rooms must have number of bedrooms, bathrooms, max guests, and price per night.');
    }
  }

  const countryDoc = await Country.findOne({ name: countryName });
  if (!countryDoc) {
    res.status(400); throw new Error(`Country '${countryName}' not found.`);
  }
  const cityDoc = await City.findOne({ name: cityName, countryId: countryDoc._id });
  if (!cityDoc) {
    res.status(400); throw new Error(`City '${cityName}' in country '${countryName}' not found.`);
  }
  const propertyTypeDoc = await PropertyType.findOne({ name: propertyTypeName });
  if (!propertyTypeDoc) {
    res.status(400); throw new Error(`Property type '${propertyTypeName}' not found.`);
  }

  // Валідація ObjectId для amenities та rules (просто перевірка валідності формату)
  const validAmenityIds = Array.isArray(amenityIds) ? amenityIds.filter(id => mongoose.Types.ObjectId.isValid(id)) : [];
  const validRuleIds = Array.isArray(ruleIds) ? ruleIds.filter(id => mongoose.Types.ObjectId.isValid(id)) : [];

  // Створення Property
  const property = new Property({
    title,
    description,
    address,
    cityId: cityDoc._id,
    ownerId,
    amenities: validAmenityIds,
    rules: validRuleIds,
    propertyTypes: [propertyTypeDoc._id], // Модель очікує масив
    isListed: true, // За замовчуванням
  });
  const createdProperty = await property.save();

  // Обробка фотографій для Property
  const propertyPhotoDocsIds = [];
  if (req.files && req.files.propertyPhotos) {
    for (const file of req.files.propertyPhotos) {
      const photo = new Photo({
        url: `/uploads/property_photos/${file.filename}`,
        filename: file.filename,
        propertyId: createdProperty._id,
      });
      const savedPhoto = await photo.save();
      propertyPhotoDocsIds.push(savedPhoto._id);
    }
  }
  // Якщо фото додані, можна оновити Property (але модель Photo вже має propertyId)
  // createdProperty.photos = propertyPhotoDocsIds; // Якщо у Property є поле photos: [ObjectId]
  // await createdProperty.save();


  // Створення кімнат та їх фотографій
  const createdRoomIds = [];
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
    createdRoomIds.push(savedRoom._id);

    // Обробка фотографій для поточної кімнати
    const roomPhotoFieldName = `room_${i}_photos`;
    if (req.files && req.files[roomPhotoFieldName]) {
      const roomPhotoDocsForThisRoomIds = [];
      for (const file of req.files[roomPhotoFieldName]) {
        const photo = new Photo({
          url: `/uploads/room_photos/${file.filename}`,
          filename: file.filename,
          roomId: savedRoom._id,
        });
        const savedRoomPhoto = await photo.save();
        roomPhotoDocsForThisRoomIds.push(savedRoomPhoto._id);
      }
      // Якщо Room має поле для фото ID, оновіть його
      // savedRoom.photos = roomPhotoDocsForThisRoomIds;
      // await savedRoom.save();
    }
  }

  // Повертаємо ID створеної нерухомості, щоб фронтенд міг перенаправити
  res.status(201).json({
    message: 'Property and rooms created successfully!',
    propertyId: createdProperty._id,
    // Можна повернути весь об'єкт property, якщо потрібно
    // property: createdProperty, 
  });
});

// ... (getProperties, getPropertyById залишаються схожими, як в property_controller_v3) ...
const getProperties = asyncHandler(async (req, res) => { /* ... */ });
const getPropertyById = asyncHandler(async (req, res) => { /* ... */ });


module.exports = {
  createPropertyWithRooms, // Нова функція
  getProperties,
  getPropertyById,
};
