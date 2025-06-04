import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const PropertyCard = ({ properties = [], searchParams = {}, onHotelClick }) => {
  const calculateNights = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 1;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  if (!properties || properties.length === 0) {
    return <div className="text-center p-4">No properties found</div>;
  }

  return (
    <div className="space-y-6">
      {properties.map((property) => {
        const nights = calculateNights(searchParams.checkIn, searchParams.checkOut);
        return (
          <Link
            key={property._id}
            to={`/properties/${property._id}?${new URLSearchParams({
              checkIn: searchParams.checkIn && !isNaN(new Date(searchParams.checkIn).getTime())
                ? new Date(searchParams.checkIn).toISOString().split('T')[0]
                : '',
              checkOut: searchParams.checkOut && !isNaN(new Date(searchParams.checkOut).getTime())
                ? new Date(searchParams.checkOut).toISOString().split('T')[0]
                : '',
              guests: searchParams.guests || '1',
            }).toString()}`}
            className="bg-white rounded-lg shadow-md overflow-hidden flex cursor-pointer hover:shadow-lg transition"
          >
            <img
              src={property.photos[0]?.url || '/fallback.jpg'}
              alt={property.title}
              className="w-1/3 h-48 object-cover"
              onError={(e) => (e.target.src = '/fallback.jpg')}
            />
            <div className="p-4 flex-1">
              <h3 className="text-lg font-semibold text-gray-800">{property.title}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {property.cityId.name}, {property.countryId.name}
              </p>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{property.description}</p>
              <div className="mt-2 flex items-center">
                <span className="bg-[#8252A1] text-white text-xs px-2 py-1 rounded">
                  {property.averageRating.toFixed(1) || 'N/A'}
                </span>
                <span className="ml-2 text-sm text-gray-600">
                  {property.averageRating >= 9
                    ? 'Wonderful'
                    : property.averageRating >= 8
                    ? 'Very Good'
                    : property.averageRating >= 7
                    ? 'Good'
                    : property.averageRating >= 6
                    ? 'Pleasant'
                    : 'No rating'}
                </span>
              </div>
            </div>
            <div className="p-4 w-1/4 flex flex-col justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  Price for {nights} {nights === 1 ? 'night' : 'nights'}
                </p>
                <p className="text-lg font-bold text-gray-800">
                  €{(property.pricePerNight * nights).toFixed(2) || 'N/A'}
                </p>
              </div>
              <button
                className="bg-[#8252A1] hover:bg-[#6f4587] text-white py-2 px-4 rounded-lg transition"
                onClick={(e) => {
                  e.preventDefault();
                  onHotelClick(property._id);
                }}
              >
                Show options
              </button>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default PropertyCard;