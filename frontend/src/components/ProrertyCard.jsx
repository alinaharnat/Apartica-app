import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const PropertyCard = ({ searchParams, filters, sortOption, onHotelClick }) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Filters received:', filters);
        console.log('Search params received:', searchParams);

        // Безпечне отримання діапазону цін і рейтингу з дефолтами
        const minPrice = filters?.priceRange?.[0] ?? 0;
        const maxPrice = filters?.priceRange?.[1] ?? 1000;
        const minRating = filters?.reviewScore?.length > 0 ? Math.min(...filters.reviewScore.map(score => {
          if (score === 'wonderful-9+') return 9;
          if (score === 'very-good-8+') return 8;
          if (score === 'good-7+') return 7;
          if (score === 'pleasant-6+') return 6;
          return 0;
        })) : 0;

        const queryParams = new URLSearchParams({
          limit: 10,
          minPrice,
          maxPrice,
          minRating,
        });

        if (searchParams?.location) {
          queryParams.append('city', searchParams.location);
        }

        if (filters?.propertyType && filters.propertyType.length > 0) {
          queryParams.append('type', filters.propertyType.join(','));
        }

        const response = await axios.get(`/api/properties?${queryParams.toString()}`);
        let propertiesData = response.data;

        if (!propertiesData || propertiesData.length === 0) {
          setError('No properties found matching your criteria.');
          setLoading(false);
          return;
        }

        const propertiesWithPhotos = await Promise.all(
          propertiesData.map(async (property) => {
            try {
              const photoResponse = await axios.get(`/api/photos?propertyId=${property._id}&limit=1`);
              const photo = photoResponse.data?.[0];
              return { ...property, photoUrl: photo?.url || 'https://via.placeholder.com/300x200?text=No+Image' };
            } catch (photoError) {
              console.error(`Error fetching photo for property ${property._id}:`, photoError);
              return { ...property, photoUrl: 'https://via.placeholder.com/300x200?text=No+Image' };
            }
          })
        );

        const propertiesWithCity = await Promise.all(
          propertiesWithPhotos.map(async (property) => {
            try {
              let cityId;
              if (!property.cityId) {
                return { ...property, cityName: 'Unknown City', countryName: 'Unknown Country' };
              }
              if (typeof property.cityId === 'string') {
                cityId = property.cityId;
              } else if (typeof property.cityId === 'object' && property.cityId._id) {
                cityId = property.cityId._id;
              } else {
                return { ...property, cityName: 'Unknown City', countryName: 'Unknown Country' };
              }

              const cityResponse = await axios.get(`/api/cities/${cityId}`);
              const cityData = cityResponse.data;
              console.log('City data:', cityData);
              return {
                ...property,
                cityName: cityData.name || 'Unknown City',
                countryName: cityData.countryId?.name || 'Unknown Country',
              };
            } catch (cityError) {
              console.error(`Error fetching city for property ${property._id}:`, cityError);
              return { ...property, cityName: 'Unknown City', countryName: 'Unknown Country' };
            }
          })
        );

        // Apply sorting based on sortOption
        let sortedProperties = [...propertiesWithCity];
        if (sortOption === 'price-low-to-high') {
          sortedProperties.sort((a, b) => (a.averageRating * 10 + 50) - (b.averageRating * 10 + 50));
        } else if (sortOption === 'price-high-to-low') {
          sortedProperties.sort((a, b) => (b.averageRating * 10 + 50) - (a.averageRating * 10 + 50));
        } else if (sortOption === 'rating') {
          sortedProperties.sort((a, b) => b.averageRating - a.averageRating);
        } else {
          // Default: sort by rating (our-top-picks)
          sortedProperties.sort((a, b) => b.averageRating - a.averageRating);
        }

        setProperties(sortedProperties);
      } catch (error) {
        console.error('Error fetching properties:', error);
        setError('Failed to load properties. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [searchParams, filters, sortOption]);

  if (loading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-600">{error}</div>;
  }

  if (properties.length === 0) {
    return <div className="text-center p-4">No properties available at the moment.</div>;
  }

  return (
    <div className="space-y-6">
      {properties.map((property) => (
        <div
          key={property._id}
          className="flex bg-white rounded-xl shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate(`/properties/${property._id}`)}
        >
          {/* Image */}
          <img
            src={property.photoUrl}
            alt={property.title}
            className="w-1/3 h-48 object-cover"
          />
          {/* Hotel Details */}
          <div className="p-4 flex-1">
            <h3 className="text-lg font-semibold text-gray-800 uppercase">{property.title}</h3>
            <p className="text-sm text-gray-600">
              {property.cityName}, {property.countryName} •{' '}
              <span className="text-purple-600 hover:underline">Show on map</span>
            </p>
            <p className="text-sm text-gray-500 mt-1">Certified</p>
            <div className="flex items-center mt-2">
              <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded">
                {property.averageRating.toFixed(1)}
              </span>
              <span className="ml-2 text-sm text-gray-600">Wonderful • 3,646 reviews</span>
            </div>
          </div>
          {/* Price and Button */}
          <div className="p-4 flex flex-col justify-between items-end">
            <p className="text-sm text-gray-600">
              1 night, {searchParams.guests} {searchParams.guests > 1 ? 'guests' : 'guest'}
            </p>
            <p className="text-xl font-bold text-gray-800">
              €{Math.round(property.averageRating * 10 + 50)}
            </p>
            <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-800 transition-colors">
              See options
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PropertyCard;