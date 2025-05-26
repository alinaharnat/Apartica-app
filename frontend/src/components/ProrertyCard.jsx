import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const PropertyCard = ({ searchParams, filters, sortOption, onHotelClick }) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const calculateNights = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Filters:', filters);
        console.log('Search params:', searchParams);

        const minPrice = filters?.priceRange?.[0] ?? 0;
        const maxPrice = filters?.priceRange?.[1] ?? 1000;
        const minRating = filters?.reviewScore?.length > 0 ? Math.min(...filters.reviewScore.map(score => {
          if (score === 'wonderful-9+') return 9;
          if (score === 'very-good-8+') return 8;
          if (score === 'good-7+') return 7;
          if (score === 'pleasant-6+') return 6;
          return 0;
        })) : null;
        const amenities = filters?.amenities?.length > 0 ? filters.amenities.join(',') : '';
        const propertyTypes = filters?.propertyType?.length > 0 ? filters.propertyType.join(',') : '';
        const guests = parseInt(searchParams?.guests) || 1;
        const checkIn = searchParams?.checkIn ? new Date(searchParams.checkIn).toISOString().split('T')[0] : null;
        const checkOut = searchParams?.checkOut ? new Date(searchParams.checkOut).toISOString().split('T')[0] : null;

        const queryParams = new URLSearchParams({
          limit: 10,
          minPrice,
          maxPrice,
          guests,
        });

        if (searchParams?.location) {
          queryParams.append('city', searchParams.location);
        }
        if (propertyTypes) {
          queryParams.append('type', propertyTypes);
        }
        if (amenities) {
          queryParams.append('amenities', amenities);
        }
        if (checkIn && checkOut) {
          queryParams.append('checkIn', checkIn);
          queryParams.append('checkOut', checkOut);
        }
        if (minRating !== null) {
          queryParams.append('minRating', minRating);
        }

        console.log('Query params:', queryParams.toString());

        const response = await axios.get(`/api/properties?${queryParams.toString()}`);
        let propertiesData = response.data;
        console.log('Properties data:', propertiesData);

        if (!propertiesData || propertiesData.length === 0) {
          setError('No properties found matching your criteria.');
          setLoading(false);
          return;
        }

        // Ensure photos is an array
        propertiesData = propertiesData.map(property => ({
          ...property,
          photos: Array.isArray(property.photos) ? property.photos : [],
        }));

        if (sortOption === 'price-low-to-high') {
          propertiesData = propertiesData.sort((a, b) => a.pricePerNight - b.pricePerNight);
        } else if (sortOption === 'price-high-to-low') {
          propertiesData = propertiesData.sort((a, b) => b.pricePerNight - a.pricePerNight);
        } else if (sortOption === 'rating') {
          propertiesData = propertiesData.sort((a, b) => b.averageRating - a.averageRating);
        }

        setProperties(propertiesData);
      } catch (error) {
        console.error('Error fetching properties:', error);
        setError('Failed to load properties. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [searchParams, filters, sortOption]);

  if (loading) return <div className="text-center p-4">Loading...</div>;
  if (error) return <div className="text-center p-4 text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      {properties.map((property) => {
        const nights = calculateNights(searchParams.checkIn, searchParams.checkOut);
        console.log('Property photos:', property.photos);
        console.log('Calculated nights:', nights);
        return (
          <div
            key={property._id}
            className="bg-white rounded-lg shadow-md overflow-hidden flex cursor-pointer"
            onClick={() => onHotelClick(property._id)}
          >
            <img
              src={property.photos[0]?.url || '/fallback.jpg'}
              alt={property.title}
              className="w-1/3 h-48 object-cover"
            />
            <div className="p-4 flex-1">
              <h3 className="text-lg font-semibold text-gray-800">{property.title}</h3>
              <p className="text-sm text-gray-600">{property.cityId?.name}, {property.cityId?.countryId?.name}</p>
              <p className="text-sm text-gray-500 mt-1">{property.description}</p>
              <div className="mt-2 flex items-center">
                <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded">
                  {property.averageRating.toFixed(1)}
                </span>
                <span className="ml-2 text-sm text-gray-600">
                  Wonderful
                </span>
              </div>
            </div>
            <div className="p-4 w-1/4 flex flex-col justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  Price for {nights} {nights === 1 ? 'night' : 'nights'}
                </p>
                <p className="text-lg font-bold text-gray-800">
                  €{(property.pricePerNight * nights) || 'N/A'}
                </p>
              </div>
              <button
                className="bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition"
                onClick={(e) => {
                  e.stopPropagation();
                  onHotelClick(property._id);
                }}
              >
                Show prices
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PropertyCard;