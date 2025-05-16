const Property = require('../models/property');

exports.createProperty = async (req, res) => {
  try {
    const newProperty = new Property({
      name: req.body.name,
      description: req.body.description,
      address: req.body.address,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      bedrooms: req.body.bedrooms,
      bathrooms: req.body.bathrooms,
      cityId: req.body.cityId,
      amenities: req.body.amenities,   // array of ObjectIds
      photos: req.body.photos,         // array of ObjectIds
      rooms: req.body.rooms,           // array of ObjectIds
      reviews: req.body.reviews,       // array of ObjectIds
      owner: req.body.owner,
      averageRating: req.body.averageRating || 0.0
    });

    const savedProperty = await newProperty.save();
    res.status(201).json(savedProperty);
  } catch (err) {
    console.error('Error creating property:', err);
    res.status(500).json({ message: 'Error creating property' });
  }
};
