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
    ratingRange: [0, 10],
    type: [],
    amenities: [],
  });
  const [tempFilters, setTempFilters] = useState({
    priceRange: ['', ''],
    ratingRange: ['', ''],
    type: [],
    amenities: [],
  });
  const [searchParams, setSearchParams] = useState({});
  const [user, setUser] = useState(null);
  const [sortOption, setSortOption] = useState('price-low-to-high');
  const [city, setCity] = useState('');
  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const [guests, setGuests] = useState('');
  const [amenitiesList, setAmenitiesList] = useState([]);
  const [propertyTypesList, setPropertyTypesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [allProperties, setAllProperties] = useState([]);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Load user data
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  // Fetch amenities and property types
  useEffect(() => {
    const fetchFormData = async () => {
      try {
        const response = await fetch('/api/properties/form-data');
        if (!response.ok) throw new Error('Failed to fetch form data');
        const data = await response.json();
        setAmenitiesList(data.amenities || []);
        setPropertyTypesList(data.propertyTypes || []);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchFormData();
  }, []);

  // Fetch properties with search parameters
  const fetchPropertiesWithSearch = async (searchCity, searchCheckIn, searchCheckOut, searchGuests, appliedFilters = {}) => {
    try {
      setLoading(true);
      const params = {};

      if (searchCity) params.city = searchCity;
      if (searchCheckIn && !isNaN(searchCheckIn.getTime())) {
        const localDate = new Date(searchCheckIn);
        localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
        params.checkIn = localDate.toISOString().split('T')[0];
      }
      if (searchCheckOut && !isNaN(searchCheckOut.getTime())) {
        const localDate = new Date(searchCheckOut);
        localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
        params.checkOut = localDate.toISOString().split('T')[0];
      }
      if (searchGuests) params.guests = searchGuests;

      // Add filter parameters
      if (appliedFilters.priceRange) {
        params.minPrice = appliedFilters.priceRange[0] || 0;
        params.maxPrice = appliedFilters.priceRange[1] || undefined;
      }
      if (appliedFilters.ratingRange) {
        params.minRating = appliedFilters.ratingRange[0] || 0;
        params.maxRating = appliedFilters.ratingRange[1] || 10;
      }
      if (appliedFilters.type?.length) params.type = appliedFilters.type.join(',');
      if (appliedFilters.amenities?.length) params.amenities = appliedFilters.amenities.join(',');

      const response = await axios.get('/api/properties', { params });
      const properties = response.data;
      setAllProperties(properties);

      // Update max price
      const prices = properties.map(p => p.pricePerNight).filter(p => p);
      const calculatedMaxPrice = prices.length > 0 ? Math.max(...prices) : 1000;
      //setMaxPrice(calculatedMaxPrice);

      return properties;
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to load properties');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Apply filters to properties (frontend fallback)
  const applyFiltersToProperties = (properties, appliedFilters) => {
    return properties.filter(property => {
      const matchesCity = !city ||
        (property.cityId?.name && property.cityId.name.toLowerCase().includes(city.toLowerCase()));

      const matchesPrice = property.pricePerNight >= appliedFilters.priceRange[0] &&
        property.pricePerNight <= appliedFilters.priceRange[1];

      const matchesRating = property.averageRating >= appliedFilters.ratingRange[0] &&
        property.averageRating <= appliedFilters.ratingRange[1];

      const matchesType = appliedFilters.type.length === 0 ||
        (property.propertyType?.name && appliedFilters.type.includes(property.propertyType.name));

      const matchesAmenities = appliedFilters.amenities.length === 0 ||
        (property.amenities && appliedFilters.amenities.every(a => property.amenities.includes(a)));

      return matchesCity && matchesPrice && matchesRating && matchesType && matchesAmenities;
    });
  };

  // Sort properties
  const sortProperties = (properties, sortBy) => {
    return [...properties].sort((a, b) => {
      switch (sortBy) {
        case 'price-low-to-high':
          return a.pricePerNight - b.pricePerNight;
        case 'price-high-to-low':
          return b.pricePerNight - a.pricePerNight;
        case 'rating':
          return b.averageRating - a.averageRating;
        default:
          return a.pricePerNight - b.pricePerNight; // Changed default to price-low-to-high
      }
    });
  };

  // Update filtered properties
  const updateFilteredProperties = () => {
    const filtered = applyFiltersToProperties(allProperties, filters);
    const sorted = sortProperties(filtered, sortOption);
    setFilteredProperties(sorted);
  };

  // Update results on filters or sort change
  useEffect(() => {
    if (allProperties.length > 0) {
      updateFilteredProperties();
    }
  }, [filters, sortOption, allProperties]);

  // Parse URL parameters and perform initial search
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchData = {
      city: params.get('city') || '',
      guests: params.get('guests') || '1',
      checkIn: params.get('checkIn') ? new Date(params.get('checkIn')) : null,
      checkOut: params.get('checkOut') ? new Date(params.get('checkOut')) : null,
      amenities: params.get('amenities')?.split(',').filter(Boolean) || [],
      type: params.get('type')?.split(',').filter(Boolean) || [],
      priceRange: params.get('priceRange')
        ? params.get('priceRange').split(',').map(Number)
        : [0, maxPrice],
      ratingRange: params.get('ratingRange')
        ? params.get('ratingRange').split(',').map(Number)
        : [0, 10],
      sort: params.get('sort') || 'price-low-to-high',
    };

    if (searchData.checkIn && isNaN(searchData.checkIn.getTime())) searchData.checkIn = null;
    if (searchData.checkOut && isNaN(searchData.checkOut.getTime())) searchData.checkOut = null;

    setSearchParams(searchData);
    setCity(searchData.city);
    setCheckIn(searchData.checkIn);
    setCheckOut(searchData.checkOut);
    setGuests(searchData.guests);
    setSortOption(searchData.sort);

    // Apply filters from URL if present
    const appliedFilters = {
      priceRange: searchData.priceRange,
      ratingRange: searchData.ratingRange,
      type: searchData.type,
      amenities: searchData.amenities,
    };
    setFilters(appliedFilters);
    setTempFilters({
      priceRange: [searchData.priceRange[0].toString(), searchData.priceRange[1].toString()],
      ratingRange: [searchData.ratingRange[0].toString(), searchData.ratingRange[1].toString()],
      type: searchData.type,
      amenities: searchData.amenities,
    });

    // Fetch properties
    fetchPropertiesWithSearch(
      searchData.city,
      searchData.checkIn,
      searchData.checkOut,
      searchData.guests,
      appliedFilters
    ).then(properties => updateFilteredProperties(properties, appliedFilters));

  }, [location.search, maxPrice]);

  // Debounced URL update
  const updateUrlWithFilters = useCallback(
    debounce((appliedFilters) => {
      const params = new URLSearchParams();
      if (city) params.append('city', city);
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
      if (appliedFilters.amenities?.length) params.append('amenities', appliedFilters.amenities.join(','));
      if (appliedFilters.type?.length) params.append('type', appliedFilters.type.join(','));
      if (appliedFilters.priceRange) params.append('priceRange', appliedFilters.priceRange.join(','));
      if (appliedFilters.ratingRange) params.append('ratingRange', appliedFilters.ratingRange.join(','));

      const validSorts = ['price-low-to-high', 'price-high-to-low', 'rating'];
      params.append('sort', validSorts.includes(sortOption) ? sortOption : 'price-low-to-high');

      const newUrl = `/search?${params.toString()}`;
      navigate(newUrl, { replace: true });
    }, 300),
    [navigate, city, checkIn, checkOut, guests, sortOption]
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

  // Apply filters
  const applyFilters = () => {
    const minPrice = tempFilters.priceRange[0] === '' ? 0 : parseInt(tempFilters.priceRange[0]) || 0;
    const maxPriceValue = tempFilters.priceRange[1] === '' ? maxPrice : parseInt(tempFilters.priceRange[1]) || maxPrice;

    const minRating = tempFilters.ratingRange[0] === '' ? 0 : parseFloat(tempFilters.ratingRange[0]) || 0;
    const maxRating = tempFilters.ratingRange[1] === '' ? 10 : parseFloat(tempFilters.ratingRange[1]) || 10;

    const appliedFilters = {
      priceRange: [minPrice, maxPriceValue],
      ratingRange: [minRating, maxRating],
      type: tempFilters.type,
      amenities: tempFilters.amenities,
    };

    setFilters(appliedFilters);
    fetchPropertiesWithSearch(city, checkIn, checkOut, guests, appliedFilters)
      .then(properties => updateFilteredProperties(properties, appliedFilters));
    updateUrlWithFilters(appliedFilters);
  };

  // Reset filters
  const resetFilters = () => {
    const resetFilters = {
      priceRange: [0, maxPrice],
      ratingRange: [0, 10],
      type: [],
      amenities: [],
    };
    setFilters(resetFilters);
    setTempFilters({
      priceRange: ['0', maxPrice.toString()],
      ratingRange: ['0', '10'],
      type: [],
      amenities: [],
    });
    return resetFilters;
  };

  // Handle reset filters
  const handleResetFilters = () => {
    const resetFiltersData = resetFilters();
    const params = new URLSearchParams();
    if (searchParams.city) params.append('city', searchParams.city);
    if (searchParams.checkIn && !isNaN(searchParams.checkIn.getTime())) {
      const localDate = new Date(searchParams.checkIn);
      localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
      params.append('checkIn', localDate.toISOString().split('T')[0]);
    }
    if (searchParams.checkOut && !isNaN(searchParams.checkOut.getTime())) {
      const localDate = new Date(searchParams.checkOut);
      localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
      params.append('checkOut', localDate.toISOString().split('T')[0]);
    }
    if (searchParams.guests) params.append('guests', searchParams.guests);

    const newUrl = `/search?${params.toString()}`;
    navigate(newUrl, { replace: true });

    fetchPropertiesWithSearch(
      searchParams.city,
      searchParams.checkIn,
      searchParams.checkOut,
      searchParams.guests,
      resetFiltersData
    ).then(properties => updateFilteredProperties(properties, resetFiltersData));
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

    // Reset filters
    const resetFiltersData = resetFilters();

    // Create URL without filter params
    const params = new URLSearchParams();
    if (city) params.append('city', city);
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

    const newUrl = `/search?${params.toString()}`;
    navigate(newUrl, { replace: true });

    // Fetch properties without filters
    fetchPropertiesWithSearch(city, checkIn, checkOut, guests, resetFiltersData)
      .then(properties => updateFilteredProperties(properties, resetFiltersData));
  };

  // Handle sort change
  const handleSortChange = (newSort) => {
    setSortOption(newSort);
    const params = new URLSearchParams(location.search);
    params.set('sort', newSort);
    const newUrl = `/search?${params.toString()}`;
    navigate(newUrl, { replace: true });
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

  const displayedAmenities = showAllAmenities ? amenitiesList : amenitiesList.slice(0, 5);

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
                    placeholder="Min"
                    value={tempFilters.priceRange[0]}
                    onChange={(e) =>
                      handleFilterChange('priceRange', [
                        e.target.value,
                        tempFilters.priceRange[1],
                      ])
                    }
                    className="w-1/2 p-2 border rounded"
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="Max"
                    value={tempFilters.priceRange[1]}
                    onChange={(e) =>
                      handleFilterChange('priceRange', [
                        tempFilters.priceRange[0],
                        e.target.value,
                      ])
                    }
                    className="w-1/2 p-2 border rounded"
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>€0</span>
                  <span>€{maxPrice}</span>
                </div>
              </div>

              {/* Rating */}
              <div className="mb-6">
                <label className="block font-medium text-gray-600 mb-2">Rating</label>
                <div className="flex gap-4">
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    placeholder="Min"
                    value={tempFilters.ratingRange[0]}
                    onChange={(e) =>
                      handleFilterChange('ratingRange', [
                        e.target.value,
                        tempFilters.ratingRange[1],
                      ])
                    }
                    className="w-1/2 p-2 border rounded"
                  />
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    placeholder="Max"
                    value={tempFilters.ratingRange[1]}
                    onChange={(e) =>
                      handleFilterChange('ratingRange', [
                        tempFilters.ratingRange[0],
                        e.target.value,
                      ])
                    }
                    className="w-1/2 p-2 border rounded"
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>0</span>
                  <span>10</span>
                </div>
              </div>

              {/* Amenities */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-600 mb-2">Amenities</h3>
                {loading ? (
                  <p>Loading amenities...</p>
                ) : amenitiesList.length > 0 ? (
                  <>
                    {displayedAmenities.map((amenity) => (
                      <label key={amenity._id} className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          className="mr-2 accent-[#8252A1]"
                          checked={tempFilters.amenities.includes(amenity.name)}
                          onChange={() => handleFilterChange('amenities', amenity.name, true)}
                        />
                        {amenity.name}
                      </label>
                    ))}
                    {amenitiesList.length > 5 && (
                      <button
                        type="button"
                        onClick={() => setShowAllAmenities(!showAllAmenities)}
                        className="text-sm text-[#8252A1] hover:underline mt-2"
                      >
                        {showAllAmenities ? 'Show Less' : `Show All (${amenitiesList.length})`}
                      </button>
                    )}
                  </>
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
                  onChange={(e) => handleSortChange(e.target.value)}
                >
                  <option value="price-low-to-high">Price (low to high)</option>
                  <option value="price-high-to-low">Price (high to low)</option>
                  <option value="rating">Rating</option>
                </select>
              </div>
            </div>
            {loading ? (
              <div className="text-center p-4">Loading...</div>
            ) : filteredProperties.length === 0 ? (
              <div className="text-center p-4">No properties found</div>
            ) : (
              <PropertyCard
                properties={filteredProperties}
                searchParams={{
                  checkIn: searchParams.checkIn,
                  checkOut: searchParams.checkOut,
                  guests: searchParams.guests,
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