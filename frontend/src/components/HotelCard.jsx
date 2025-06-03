import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HotelCard = ({ searchParams, filters }) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const scrollContainerRef = useRef(null);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        setError(null);

        const minPrice = filters?.priceRange?.[0] ?? 0;
        const maxPrice = filters?.priceRange?.[1] ?? 10000;
        const minRating = filters?.reviewScore ?? 0;

        const queryParams = new URLSearchParams({
          sort: '-positiveReviewCount',
          limit: 10,
          minPrice,
          maxPrice,
          minRating,
        });

        if (searchParams?.location) {
          queryParams.append('city', searchParams.location);
        }

        if (filters?.propertyType && filters.propertyType !== 'all') {
          queryParams.append('type', filters.propertyType);
        }

        // Добавляем populate для cityId и countryId
        queryParams.append('populate', 'cityId,countryId');

        const response = await axios.get(`/api/properties?${queryParams.toString()}`);
        let propertiesData = response.data;

        if (!propertiesData || propertiesData.length === 0) {
          setError('No properties found matching your criteria.');
          return;
        }

        propertiesData = propertiesData.map(property => ({
          ...property,
          photos: Array.isArray(property.photos) ? property.photos : [],
        }));

        setProperties(propertiesData);
      } catch (error) {
        console.error('Error fetching properties:', error);
        setError('Failed to load properties. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [searchParams, filters]);

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
      handleScroll();
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [properties]);

  if (loading) return <div className="text-center p-4">Loading...</div>;
  if (error) return <div className="text-center p-4 text-red-600">{error}</div>;

  return (
    <div className="relative p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Homes guests love</h1>
      <div
        ref={scrollContainerRef}
        className="flex overflow-x-scroll space-x-4 scrollbar-hide scroll-smooth"
        style={{ padding: '32px 0' }}
      >
        {properties.map((property) => (
          <div
            key={property._id}
            className="flex-none min-w-[300px] max-w-[300px] bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 transform hover:scale-105 hover:shadow-xl cursor-pointer"
            onClick={() => navigate(`/properties/${property._id}`)}
          >
            <img
              src={property.photos[0]?.url || 'https://via.placeholder.com/300x200?text=No+Image'}
              alt={property.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h3 className="text-lg font-semibold line-clamp-2">{property.title}</h3>
              <p className="text-gray-600 text-sm line-clamp-1">
                {property.cityId?.name || 'Unknown City'}, {property.countryId?.name || 'Unknown Country'}
              </p>
              <div className="flex items-center mt-2">
                <span className="bg-purple-600 text-white text-xs font-semibold px-2.5 py-0.5 rounded">
                  {property.averageRating?.toFixed(1) || 'N/A'}
                </span>
                <span className="ml-2 text-sm text-gray-600">Excellent</span>
              </div>
              <p className="mt-2 text-gray-600">
                Starting from €{property.pricePerNight || 'N/A'}
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