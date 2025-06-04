import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PropertyCard from '../components/PropertyCard';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import DatePicker, { registerLocale } from 'react-datepicker';
import enGB from 'date-fns/locale/en-GB';
import cn from 'classnames';
import axios from 'axios'; 
import 'react-datepicker/dist/react-datepicker.css';

registerLocale('en-GB', enGB);

// Custom debounce function
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const SearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    priceRange: [0, 1000],
    type: [],
    reviewScore: [],
    amenities: [],
  });
  const [tempFilters, setTempFilters] = useState({
    priceRange: [0, 1000],
    type: [],
    reviewScore: [],
    amenities: [],
  });
  const [searchParams, setSearchParams] = useState({});
  const [user, setUser] = useState(null);
  const [sortOption, setSortOption] = useState('our-top-picks');
  const [city, setCity] = useState('');
  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const [guests, setGuests] = useState('');
  const [amenitiesList, setAmenitiesList] = useState([]);
  const [propertyTypesList, setPropertyTypesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Load user data
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);
  const fetchAndFilterProperties = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/properties');
      let properties = response.data;
  
      // Применяем фильтры
      properties = properties.filter(property => {
        const matchesCity = !city || 
          (property.cityId?.name && property.cityId.name.toLowerCase().includes(city.toLowerCase()));
        const matchesPrice = property.pricePerNight >= tempFilters.priceRange[0] && 
          property.pricePerNight <= tempFilters.priceRange[1];
          const getMinRating = () => {
            if (tempFilters.reviewScore.length === 0) return 0;
            const minRatings = tempFilters.reviewScore.map(s => 
              reviewScoreOptions.find(o => o.value === s)?.minRating || 0
            );
            return Math.min(...minRatings);
          };
          
          const matchesRating = property.averageRating >= getMinRating();
        
        // Фильтрация по типам и удобствам
        const matchesType = tempFilters.type.length === 0 || 
          (property.type && tempFilters.type.includes(property.type));
        const matchesAmenities = tempFilters.amenities.length === 0 || 
          (property.amenities && tempFilters.amenities.every(a => property.amenities.includes(a)));
  
        return matchesCity && matchesPrice && matchesRating && matchesType && matchesAmenities;
      });
  
      // Применяем сортировку
      properties.sort((a, b) => {
        switch (sortOption) {
          case 'price-low-to-high': return a.pricePerNight - b.pricePerNight;
          case 'price-high-to-low': return b.pricePerNight - a.pricePerNight;
          case 'rating': return b.averageRating - a.averageRating;
          default: return (b.positiveReviewCount - a.positiveReviewCount) || 
                        (b.averageRating - a.averageRating);
        }
      });
  
      setFilteredProperties(properties);
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAndFilterProperties();
  }, [tempFilters, sortOption, city]); // Используем tempFilters вместо filters

  // Fetch amenities and property types
  useEffect(() => {
    const fetchFormData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/properties/form-data');
        if (!response.ok) throw new Error('Failed to fetch form data');
        const data = await response.json();
        setAmenitiesList(data.amenities || []);
        setPropertyTypesList(data.propertyTypes || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchFormData();
  }, []);

  // Parse URL parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchData = {
      city: params.get('city') || '', 
      guests: params.get('guests') || '1',
      checkIn: params.get('checkIn') ? new Date(params.get('checkIn')) : null,
      checkOut: params.get('checkOut') ? new Date(params.get('checkOut')) : null,
      amenities: params.get('amenities')?.split(',').filter(Boolean) || [],
      type: params.get('type')?.split(',').filter(Boolean) || [],
      reviewScore: params.get('reviewScore')?.split(',').filter(Boolean) || [],
      priceRange: params.get('priceRange')
        ? params.get('priceRange').split(',').map(Number)
        : [0, 1000],
      sort: params.get('sort') || 'our-top-picks',
    };

    // Validate dates
    if (searchData.checkIn && isNaN(searchData.checkIn.getTime())) searchData.checkIn = null;
    if (searchData.checkOut && isNaN(searchData.checkOut.getTime())) searchData.checkOut = null;

    setSearchParams(searchData);
    setCity(searchData.city);
    setCheckIn(searchData.checkIn);
    setCheckOut(searchData.checkOut);
    setGuests(searchData.guests);
    setSortOption(searchData.sort);
    setFilters({
      priceRange: searchData.priceRange,
      type: searchData.type,
      reviewScore: searchData.reviewScore,
      amenities: searchData.amenities,
    });
    setTempFilters({
      priceRange: searchData.priceRange,
      type: searchData.type,
      reviewScore: searchData.reviewScore,
      amenities: searchData.amenities,
    });
    console.log('Parsed searchParams:', searchData);
  }, [location.search]);

  // Debounced URL update
  const updateUrl = useCallback(
    debounce((params) => {
      const urlParams = new URLSearchParams();
      if (params.city) urlParams.append('city', params.city); 
      if (params.checkIn && !isNaN(params.checkIn.getTime())) {
        const localDate = new Date(params.checkIn);
        localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
        urlParams.append('checkIn', localDate.toISOString().split('T')[0]);
      }
      if (params.checkOut && !isNaN(params.checkOut.getTime())) {
        const localDate = new Date(params.checkOut);
        localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
        urlParams.append('checkOut', localDate.toISOString().split('T')[0]);
      }
      if (params.guests) urlParams.append('guests', params.guests);
      if (params.amenities?.length) urlParams.append('amenities', params.amenities.join(','));
      if (params.type?.length) urlParams.append('type', params.type.join(','));
      if (params.priceRange) urlParams.append('priceRange', params.priceRange.join(','));
      if (params.reviewScore?.length) urlParams.append('reviewScore', params.reviewScore.join(','));

      // Ensure sort is valid
      const validSorts = ['our-top-picks', 'price-low-to-high', 'price-high-to-low', 'rating'];
      urlParams.append('sort', validSorts.includes(params.sort) ? params.sort : 'our-top-picks');

      const newUrl = `/search?${urlParams.toString()}`;
      navigate(newUrl, { replace: true }); // Use replace to avoid stacking history
      console.log('Updated URL:', newUrl);
    }, 300),
    [navigate]
  );

  // Handle filter changes
  const handleFilterChange = (name, value, isCheckbox = false) => {
    setTempFilters(prev => {
      if (isCheckbox) {
        const currentValues = prev[name];
        const updatedValues = currentValues.includes(value)
          ? currentValues.filter(v => v !== value)
          : [...currentValues, value];
        return { ...prev, [name]: updatedValues };
      }
      return { ...prev, [name]: value };
    });
  };
  const applyFilters = () => {
    setFilters(tempFilters);
    updateUrl({ 
      ...searchParams, 
      ...tempFilters, 
      city, 
      checkIn, 
      checkOut, 
      guests, 
      sort: sortOption 
    });
    fetchAndFilterProperties();
  };

  const handleResetFilters = () => {
    const resetFilters = {
      priceRange: [0, 1000],
      type: [],
      reviewScore: [],
      amenities: [],
    };
    setTempFilters(resetFilters);
    setFilters(resetFilters);
    setSortOption('our-top-picks');
    updateUrl({ ...resetFilters, city, checkIn, checkOut, guests, sort: 'our-top-picks' });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (checkIn && checkOut && checkIn >= checkOut) {
      setError('Check-out date must be after check-in date');
      return;
    }
    if (checkIn && isNaN(checkIn.getTime())) {
      setError('Invalid check-in date');
      return;
    }
    if (checkOut && isNaN(checkOut.getTime())) {
      setError('Invalid check-out date');
      return;
    }
    setError(null);
    updateUrl({ ...searchParams, ...filters, city, checkIn, checkOut, guests, sort: sortOption });
  };

  // Handle hotel click
  const handleHotelClick = (propertyId) => {
    const params = new URLSearchParams();
    if (checkIn && !isNaN(checkIn.getTime())) {
      const localDate = new Date(checkIn);
      localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
      params.append('checkIn', localDate.toISOString().split('T')[0]);
    }
    if (checkOut && !isNaN(checkOut.getTime())) {
      const localDate = new Date(checkOut);
      localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
      params.append('checkOut', localDate.toISOString().split('T')[0]);
    }
    if (guests) params.append('guests', guests);
    navigate(`/properties/${propertyId}?${params.toString()}`);
  };

  const dateInputCls = (err) =>
    cn(
      'bg-transparent outline-none text-sm placeholder:text-gray-400 min-w-[112px] sm:min-w-[120px] lg:min-w-[136px]',
      err && 'border border-red-500 rounded'
    );

  // Review score options
  const reviewScoreOptions = [
    { value: 'wonderful-9+', label: 'Wonderful: 9+', minRating: 9 },
    { value: 'very-good-8+', label: 'Very Good: 8+', minRating: 8 },
    { value: 'good-7+', label: 'Good: 7+', minRating: 7 },
    { value: 'pleasant-6+', label: 'Pleasant: 6+', minRating: 6 },
  ];

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <Navbar user={user} />

      <div className="container mx-auto px-6 sm:px-8 lg:px-12 py-28 flex-1">
        {/* Search Bar */}
        <div className="mb-12">
          <form
            onSubmit={handleSubmit}
            className="bg-white shadow-md rounded-full flex flex-wrap lg:flex-nowrap gap-x-6 gap-y-4 items-center w-full max-w-[950px] mx-auto px-6 py-4"
          >
            <div className="flex flex-col flex-1 min-w-[150px]">
              <label className="text-xs font-semibold text-gray-700">Where</label>
              <input
                list="cities"
                placeholder="Search city"
                className="bg-transparent outline-none placeholder:text-gray-400 text-sm"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <datalist id="cities">
                <option value="Kyiv" />
                <option value="Paris" />
                <option value="Tokyo" />
                <option value="London" />
              </datalist>
            </div>

            <div className="flex flex-col border-l border-gray-300 pl-0 lg:pl-6 lg:flex-1 min-w-[150px]">
              <label className="text-xs font-semibold text-gray-700 lg:pl-0 pl-6">Check in</label>
              <DatePicker
                selected={checkIn}
                onChange={(d) => {
                  setCheckIn(d);
                  if (d && checkOut && d >= checkOut) setCheckOut(null);
                  setError(null);
                }}
                dateFormat="MMM d"
                placeholderText="Add date"
                minDate={today}
                locale="en-GB"
                className={dateInputCls()}
                wrapperClassName="pl-6 lg:pl-0"
                popperPlacement="bottom-start"
              />
            </div>

            <div className="flex flex-col border-l border-gray-300 pl-0 lg:pl-6 lg:flex-1 min-w-[150px]">
              <label className="text-xs font-semibold text-gray-700 lg:pl-0 pl-6">Check out</label>
              <DatePicker
                selected={checkOut}
                onChange={(d) => {
                  setCheckOut(d);
                  setError(null);
                }}
                dateFormat="MMM d"
                placeholderText="Add date"
                minDate={checkIn || today}
                locale="en-GB"
                className={dateInputCls()}
                wrapperClassName="pl-6 lg:pl-0"
                popperPlacement="bottom-start"
              />
            </div>

            <div className="flex flex-col border-l border-gray-300 pl-6 min-w-[110px]">
              <label className="text-xs font-semibold text-gray-700">Who</label>
              <input
                type="number"
                min={1}
                max={10}
                placeholder="Add guests"
                className="bg-transparent outline-none text-sm placeholder:text-gray-400 min-w-[96px]"
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="ml-auto lg:ml-6 bg-[#8252A1] hover:bg-[#6f4587] transition-colors rounded-full p-3 w-full sm:w-auto"
            >
              <svg
                className="w-5 h-5 text-white mx-auto"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-3.5-3.5M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>
        </div>

        {error && <div className="text-red-500 text-center mb-4">{error}</div>}

        <div className="flex flex-col md:flex-row gap-12">
          {/* Filters */}
          <aside className="w-full md:w-1/4">
            <div className="bg-white p-8 rounded-xl shadow-lg sticky top-24">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-700">Filter:</h2>
                <button
                  onClick={handleResetFilters}
                  className="text-sm text-[#8252A1] hover:underline"
                >
                  Reset Filters
                </button>
              </div>

              {/* Price */}
              <div className="mb-6">
                <label className="block font-medium text-gray-600 mb-2">Price (per night)</label>
                <div className="flex gap-4">
                  <input
                    type="number"
                    min="0"
                    max={tempFilters.priceRange[1]}
                    value={tempFilters.priceRange[0]}
                    onChange={(e) =>
                      handleFilterChange('priceRange', [
                        parseInt(e.target.value) || 0,
                        tempFilters.priceRange[1],
                      ])
                    }
                    className="w-1/2 p-2 border rounded"
                  />
                  <input
                    type="number"
                    min={tempFilters.priceRange[0]}
                    max="1000"
                    value={tempFilters.priceRange[1]}
                    onChange={(e) =>
                      handleFilterChange('priceRange', [
                        tempFilters.priceRange[0],
                        parseInt(e.target.value) || 1000,
                      ])
                    }
                    className="w-1/2 p-2 border rounded"
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>€{tempFilters.priceRange[0]}</span>
                  <span>€{tempFilters.priceRange[1]}</span>
                </div>
              </div>

              {/* Amenities */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-600 mb-2">Amenities</h3>
                {loading ? (
                  <p>Loading amenities...</p>
                ) : amenitiesList.length > 0 ? (
                  amenitiesList.map((amenity) => (
                    <label key={amenity._id} className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        className="mr-2 accent-[#8252A1]"
                        checked={tempFilters.amenities.includes(amenity.name)}
                        onChange={() => handleFilterChange('amenities', amenity.name, true)}
                      />
                      {amenity.name}
                    </label>
                  ))
                ) : (
                  <p>No amenities available</p>
                )}
              </div>

              {/* Property Type */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-600 mb-2">Property Type</h3>
                {loading ? (
                  <p>Loading property types...</p>
                ) : propertyTypesList.length > 0 ? (
                  propertyTypesList.map((type) => (
                    <label key={type._id} className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        className="mr-2 accent-[#8252A1]"
                        checked={tempFilters.type.includes(type.name)}
                        onChange={() => handleFilterChange('type', type.name, true)}
                      />
                      {type.name}
                    </label>
                  ))
                ) : (
                  <p>No property types available</p>
                )}
              </div>

              {/* Review Score */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-600 mb-2">Review Score</h3>
                {reviewScoreOptions.map((option) => (
                  <label key={option.value} className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      className="mr-2 accent-[#8252A1]"
                      checked={tempFilters.reviewScore.includes(option.value)}
                      onChange={() => handleFilterChange('reviewScore', option.value, true)}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
              <button
                onClick={applyFilters}
                className="w-full mt-6 bg-[#8252A1] text-white py-2 px-4 rounded-lg hover:bg-[#6f4587] transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </aside>

          {/* Results */}
          <main className="w-full md:w-3/4">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-semibold text-gray-800">
                {searchParams.city ? searchParams.city.charAt(0).toUpperCase() + searchParams.city.slice(1) : 'Search Results'}
              </h2>
              <div>
                <label className="text-gray-600 mr-2">Sort by:</label>
                <select
                  className="p-2 border rounded-lg bg-gray-100"
                  value={sortOption}
                  onChange={(e) => {
                    setSortOption(e.target.value);
                    updateUrl({ ...searchParams, sort: e.target.value });
                  }}
                >
                  <option value="our-top-picks">Our top picks</option>
                  <option value="price-low-to-high">Price (low to high)</option>
                  <option value="price-high-to-low">Price (high to low)</option>
                  <option value="rating">Rating</option>
                </select>
              </div>
            </div>
            {loading ? (
              <div className="text-center p-4">Loading...</div>
            ) : (
              <PropertyCard
              properties={filteredProperties}
              searchParams={{
                checkIn,
                checkOut,
                guests,
              }}
              onHotelClick={handleHotelClick}
            />
            )}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default SearchResults;