// controllers/geocodeController.js
const asyncHandler = require('express-async-handler');
const axios = require('axios');
const Country = require('../models/country');
const City = require('../models/city');

/**
 * @desc    Geocode an address using Google Maps API, find/create Country & City.
 * @route   POST /api/geocode/address
 * @access  Private (requires user to be logged in)
 */
const geocodeAddress = asyncHandler(async (req, res) => {
    console.log('Geocode request received:', req.body);
    const { address } = req.body;

    if (!address) {
        res.status(400);
        throw new Error('Please provide an address string to geocode.');
    }

    // Use the same env variable name as in app.js
    const GOOGLE_MAPS_API_KEY = "AIzaSyAana5_GO5uQ1QViojkj2E_ErPULxJFYZ4";

    if (!GOOGLE_MAPS_API_KEY) {
        console.error('CRITICAL: Google Maps API Key is not configured.');
        res.status(500);
        throw new Error('Geocoding service is currently unavailable due to a configuration issue.');
    }

    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;

    try {
        console.log('Calling Google Geocode API...');
        const { data: geocodeData } = await axios.get(geocodeUrl);
        console.log('Geocode API response status:', geocodeData.status);

        if (geocodeData.status !== 'OK' || !geocodeData.results || geocodeData.results.length === 0) {
            console.warn('Geocoding API did not return a valid result for address:', address, 'Status:', geocodeData.status, 'Error Message:', geocodeData.error_message);
            res.status(404);
            let userMessage = 'The provided address could not be found or processed by the geocoding service.';
            if (geocodeData.status === 'ZERO_RESULTS') {
                userMessage = `No results were found for the address: "${address}". Please try a more specific or differently formatted address.`;
            } else if (geocodeData.error_message) {
                userMessage = `Geocoding service error: ${geocodeData.error_message}. Please check the address or try again later.`;
            }
            throw new Error(userMessage);
        }

        const result = geocodeData.results[0];
        const formattedAddress = result.formatted_address;
        const { lat, lng } = result.geometry.location;

        console.log('Geocoded successfully:', {
            formattedAddress,
            lat,
            lng
        });

        let countryName = '';
        let cityName = '';

        // Extract address components
        for (const component of result.address_components) {
            if (component.types.includes('country')) {
                countryName = component.long_name;
            }
            if (component.types.includes('locality')) {
                cityName = component.long_name;
            }
        }
        
        // Fallback logic for city name if 'locality' is not present
        if (!cityName) {
            for (const component of result.address_components) {
                if (component.types.includes('postal_town')) {
                    cityName = component.long_name;
                    break; 
                } else if (component.types.includes('administrative_area_level_2')) {
                    cityName = component.long_name;
                    break;
                } else if (component.types.includes('administrative_area_level_1') && !cityName) {
                    cityName = component.long_name;
                }
            }
        }
        
        // Further fallback
        if (!cityName) {
            for (const component of result.address_components) {
                if (component.types.includes('sublocality_level_1') || component.types.includes('sublocality') || component.types.includes('neighborhood')) {
                    cityName = component.long_name;
                    break;
                }
            }
        }

        console.log('Extracted location data:', { countryName, cityName });

        if (!countryName) {
            res.status(400);
            throw new Error('Could not determine the country from the provided address. Please ensure the address is complete and includes a country.');
        }
        if (!cityName) {
            console.warn(`City name could not be reliably determined for address: ${formattedAddress}. Components:`, result.address_components);
            res.status(400);
            throw new Error('Could not determine the city from the provided address. Please try a more specific or differently formatted address.');
        }

        // Find or create Country
        let countryDoc = await Country.findOne({ name: countryName });
        if (!countryDoc) {
            console.log('Creating new country:', countryName);
            countryDoc = await Country.create({ name: countryName });
        }

        // Find or create City
        let cityDoc = await City.findOne({ name: cityName, countryId: countryDoc._id });
        if (!cityDoc) {
            console.log('Creating new city:', cityName);
            cityDoc = await City.create({
                name: cityName,
                countryId: countryDoc._id
            });
        }
        
        // Prepare the response payload
        const responsePayload = {
            country: {
                _id: countryDoc._id.toString(),
                name: countryDoc.name,
            },
            city: {
                _id: cityDoc._id.toString(),
                name: cityDoc.name,
                country: cityDoc.countryId.toString(),
            },
            formattedAddress: formattedAddress,
            latitude: lat,
            longitude: lng,
        };
        
        console.log('Sending response:', responsePayload);
        res.status(200).json(responsePayload);

    } catch (error) {
        console.error('Geocoding process error:', error.message);
        if (error.response) {
            console.error('API Error response:', error.response.data);
        }
        
        // Check if headers already sent
        if (!res.headersSent) {
            const statusCode = error.status || error.statusCode || res.statusCode || 500;
            res.status(statusCode);
        }
        
        throw new Error(error.message || 'An unexpected error occurred during the geocoding process.');
    }
});

module.exports = {
    geocodeAddress,
};