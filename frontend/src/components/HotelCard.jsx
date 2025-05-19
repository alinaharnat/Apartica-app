import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const HotelCard = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const scrollContainerRef = useRef(null);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/properties?sort=-averageRating&limit=10');
        console.log('Properties response:', response.data);
        const propertiesData = response.data;

        if (!propertiesData || propertiesData.length === 0) {
          setError('No properties found.');
          setLoading(false);
          return;
        }

        const propertiesWithPhotos = await Promise.all(
          propertiesData.map(async (property) => {
            try {
              const photoResponse = await axios.get(`/api/photos?propertyId=${property._id}&limit=1`);
              console.log(`Photo response for ${property._id}:`, photoResponse.data);
              const photo = photoResponse.data[0];
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
              if (!property.cityId) {
                console.warn(`No cityId for property ${property._id}:`, property);
                return { ...property, cityName: 'Unknown City', countryName: 'Unknown Country' };
              }
              const cityResponse = await axios.get(`/api/cities/${property.cityId}`);
              console.log(`City response for cityId ${property.cityId}:`, cityResponse.data);
              const cityData = cityResponse.data;
              return {
                ...property,
                cityName: cityData.name || 'Unknown City',
                countryName: cityData.country || 'Unknown Country'
              };
            } catch (cityError) {
              console.error(`Error fetching city for property ${property._id}:`, cityError);
              return { ...property, cityName: 'Unknown City', countryName: 'Unknown Country' };
            }
          })
        );

        setProperties(propertiesWithCity);
      } catch (error) {
        console.error('Error fetching properties:', error);
        setError('Failed to load properties. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setShowLeftButton(scrollLeft > 0);
      setShowRightButton(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  const scrollLeft = () => {
    scrollContainerRef.current.scrollBy({ left: -316, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollContainerRef.current.scrollBy({ left: 316, behavior: 'smooth' });
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      handleScroll(); // Initial check
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [properties]);

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
    <div className="relative p-4">
      <div
        ref={scrollContainerRef}
        className="flex overflow-x-scroll space-x-4 scrollbar-hide scroll-smooth"
        style={{ padding: '32px 0' }}
      >
        {properties.map((property) => (
          <div
            key={property._id}
            className="flex-none min-w-[300px] max-w-[300px] bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 transform hover:scale-105 hover:shadow-xl"
            style={{ transformOrigin: 'top' }}
          >
            <img
              src={property.photoUrl}
              alt={property.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h3 className="text-lg font-semibold line-clamp-2">{property.title}</h3>
              <p className="text-gray-600 text-sm line-clamp-1">
                {property.cityName}, {property.countryName}
              </p>
              <div className="flex items-center mt-2">
                <span className="bg-purple-600 text-white text-xs font-semibold px-2.5 py-0.5 rounded">
                  {property.averageRating.toFixed(1)}
                </span>
                <span className="ml-2 text-sm text-gray-600">Excellent</span>
              </div>
              <p className="mt-2 text-gray-600">
                Starting from €{Math.round(property.averageRating * 10 + 50)}
              </p>
            </div>
          </div>
        ))}
      </div>
      {showLeftButton && (
        <button
          onClick={scrollLeft}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white rounded-full shadow-md p-2 hover:bg-gray-100 z-10"
        >
          <ChevronLeft size={24} />
        </button>
      )}
      {showRightButton && (
        <button
          onClick={scrollRight}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white rounded-full shadow-md p-2 hover:bg-gray-100 z-10"
        >
          <ChevronRight size={24} />
        </button>
      )}
    </div>
  );
};

export default HotelCard;