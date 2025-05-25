import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import HotelCard from '../components/HotelCard';
import axios from 'axios';

const SearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    priceRange: [0, 1000],
    propertyType: 'all',
    reviewScore: 0,
    amenities: []
  });
  const [searchParams, setSearchParams] = useState({});

  // Парсим параметры URL при загрузке
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchData = {
      location: params.get('location') || '',
      checkIn: params.get('checkIn'),
      checkOut: params.get('checkOut'),
      guests: params.get('guests') || 1
    };
    setSearchParams(searchData);
  }, [location.search]);

  // Функция для применения фильтров
  const handleFilterChange = (name, value) => {
    setFilters({...filters, [name]: value});
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        Hotels in {searchParams.location || 'popular destinations'}
      </h1>
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Боковая панель фильтров */}
        <div className="w-full md:w-1/4">
          <div className="bg-white p-4 rounded-lg shadow-md sticky top-4">
            <h2 className="text-xl font-bold mb-4">Filters</h2>
            
            {/* Фильтр по цене */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Price range (per night)</h3>
              <input
                type="range"
                min="0"
                max="1000"
                value={filters.priceRange[1]}
                onChange={(e) => handleFilterChange('priceRange', [filters.priceRange[0], parseInt(e.target.value)])}
                className="w-full"
              />
              <div className="flex justify-between mt-2">
                <span>€{filters.priceRange[0]}</span>
                <span>€{filters.priceRange[1]}</span>
              </div>
            </div>
            
            {/* Фильтр по типу */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Property type</h3>
              <select
                className="w-full p-2 border rounded"
                value={filters.propertyType}
                onChange={(e) => handleFilterChange('propertyType', e.target.value)}
              >
                <option value="all">All types</option>
                <option value="hotel">Hotels</option>
                <option value="apartment">Apartments</option>
                <option value="hostel">Hostels</option>
              </select>
            </div>
            
            {/* Фильтр по рейтингу */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Review score</h3>
              <select
                className="w-full p-2 border rounded"
                value={filters.reviewScore}
                onChange={(e) => handleFilterChange('reviewScore', parseInt(e.target.value))}
              >
                <option value="0">Any rating</option>
                <option value="4">Wonderful (4+)</option>
                <option value="3">Very good (3+)</option>
                <option value="2">Good (2+)</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Основной контент */}
        <div className="w-full md:w-3/4">
          {/* Передаем параметры поиска в HotelCard */}
          <HotelCard 
            searchParams={searchParams}
            filters={filters}
            onHotelClick={(hotelId) => navigate(`/properties/${hotelId}`)}
          />
        </div>
      </div>
    </div>
  );
};

export default SearchResults;