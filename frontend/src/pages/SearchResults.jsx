import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PropertyCard from '../components/ProrertyCard';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import DatePicker, { registerLocale } from 'react-datepicker';
import enGB from 'date-fns/locale/en-GB';
import cn from 'classnames';
import 'react-datepicker/dist/react-datepicker.css';

registerLocale('en-GB', enGB);

const SearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    priceRange: [0, 1000],
    propertyType: [],
    reviewScore: [],
    amenities: [],
  });
  const [searchParams, setSearchParams] = useState({});
  const [user, setUser] = useState(null);
  const [sortOption, setSortOption] = useState('our-top-picks');
  const [destination, setDestination] = useState('');
  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const [guests, setGuests] = useState('');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchData = {
      location: params.get('location') || '',
      checkIn: params.get('checkIn') ? new Date(params.get('checkIn')) : null,
      checkOut: params.get('checkOut') ? new Date(params.get('checkOut')) : null,
      guests: params.get('guests') || 1,
    };
    setSearchParams(searchData);
    setDestination(searchData.location);
    setCheckIn(searchData.checkIn);
    setCheckOut(searchData.checkOut);
    setGuests(searchData.guests);
  }, [location.search]);

  const handleFilterChange = (name, value, isCheckbox = false) => {
    if (isCheckbox) {
      setFilters((prev) => {
        const currentValues = prev[name];
        if (currentValues.includes(value)) {
          return { ...prev, [name]: currentValues.filter((v) => v !== value) };
        } else {
          return { ...prev, [name]: [...currentValues, value] };
        }
      });
    } else {
      setFilters({ ...filters, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    params.append('location', destination);
    if (checkIn) params.append('checkIn', checkIn.toISOString());
    if (checkOut) params.append('checkOut', checkOut.toISOString());
    params.append('guests', guests);
    navigate(`/search?${params.toString()}`);
  };

  const dateInputCls = (err) =>
    cn(
      'bg-transparent outline-none text-sm placeholder:text-gray-400 min-w-[112px] sm:min-w-[120px] lg:min-w-[136px]',
      err && 'border border-red-500 rounded'
    );

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
                list="destinations"
                placeholder="Search destination"
                className="bg-transparent outline-none placeholder:text-gray-400 text-sm"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
              <datalist id="destinations">
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
                onChange={(d) => setCheckOut(d)}
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
              className="ml-auto lg:ml-6 bg-purple-600 hover:bg-purple-800 transition-colors rounded-full p-3 w-full sm:w-auto"
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

        <div className="flex flex-col md:flex-row gap-12">
          {/* Map and Filters */}
          <aside className="w-full md:w-1/4">
            {/* Map Placeholder */}
            <div className="bg-gray-200 h-64 rounded-lg mb-8 flex items-center justify-center">
              <p className="text-gray-500">Map Placeholder (e.g., Google Maps)</p>
            </div>

            {/* Filters */}
            <div className="bg-white p-8 rounded-xl shadow-lg sticky top-24">
              <h2 className="text-xl font-bold text-gray-700 mb-6">Filter:</h2>

              {/* Price */}
              <div className="mb-6">
                <label className="block font-medium text-gray-600 mb-2">Price (per night)</label>
                <input
                  type="range"
                  min="0"
                  max="1000"
                  value={filters.priceRange[1]}
                  onChange={(e) =>
                    handleFilterChange('priceRange', [filters.priceRange[0], parseInt(e.target.value)])
                  }
                  className="w-full accent-purple-500"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>€{filters.priceRange[0]}</span>
                  <span>€{filters.priceRange[1]}</span>
                </div>
              </div>

              {/* Popular Filters */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-600 mb-2">Popular Filters</h3>
                <label className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    className="mr-2 accent-purple-500"
                    checked={filters.amenities.includes('private-bathroom')}
                    onChange={() => handleFilterChange('amenities', 'private-bathroom', true)}
                  />
                  Private Bathroom
                </label>
                <label className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    className="mr-2 accent-purple-500"
                    checked={filters.amenities.includes('hotels')}
                    onChange={() => handleFilterChange('amenities', 'hotels', true)}
                  />
                  Hotels
                </label>
                <label className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    className="mr-2 accent-purple-500"
                    checked={filters.amenities.includes('5-stars')}
                    onChange={() => handleFilterChange('amenities', '5-stars', true)}
                  />
                  5 stars
                </label>
                <label className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    className="mr-2 accent-purple-500"
                    checked={filters.amenities.includes('pet-friendly')}
                    onChange={() => handleFilterChange('amenities', 'pet-friendly', true)}
                  />
                  Pet Friendly
                </label>
              </div>

              {/* Property Type */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-600 mb-2">Property Type</h3>
                <label className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    className="mr-2 accent-purple-500"
                    checked={filters.propertyType.includes('hotels')}
                    onChange={() => handleFilterChange('propertyType', 'hotels', true)}
                  />
                  Hotels
                </label>
                <label className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    className="mr-2 accent-purple-500"
                    checked={filters.propertyType.includes('apartments')}
                    onChange={() => handleFilterChange('propertyType', 'apartments', true)}
                  />
                  Apartments
                </label>
                <label className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    className="mr-2 accent-purple-500"
                    checked={filters.propertyType.includes('hostels')}
                    onChange={() => handleFilterChange('propertyType', 'hostels', true)}
                  />
                  Hostels
                </label>
              </div>

              {/* Review Score */}
              <div>
                <h3 className="font-medium text-gray-600 mb-2">Review Score</h3>
                <label className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    className="mr-2 accent-purple-500"
                    checked={filters.reviewScore.includes('wonderful-9+')}
                    onChange={() => handleFilterChange('reviewScore', 'wonderful-9+', true)}
                  />
                  Wonderful: 9+
                </label>
                <label className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    className="mr-2 accent-purple-500"
                    checked={filters.reviewScore.includes('very-good-8+')}
                    onChange={() => handleFilterChange('reviewScore', 'very-good-8+', true)}
                  />
                  Very Good: 8+
                </label>
                <label className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    className="mr-2 accent-purple-500"
                    checked={filters.reviewScore.includes('good-7+')}
                    onChange={() => handleFilterChange('reviewScore', 'good-7+', true)}
                  />
                  Good: 7+
                </label>
                <label className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    className="mr-2 accent-purple-500"
                    checked={filters.reviewScore.includes('pleasant-6+')}
                    onChange={() => handleFilterChange('reviewScore', 'pleasant-6+', true)}
                  />
                  Pleasant: 6+
                </label>
              </div>
            </div>
          </aside>

          {/* Results */}
          <main className="w-full md:w-3/4">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-semibold text-gray-800">
                {searchParams.location}: Over 1,000 places
              </h2>
              <div>
                <label className="text-gray-600 mr-2">Sort by:</label>
                <select
                  className="p-2 border rounded-lg bg-gray-100"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                >
                  <option value="our-top-picks">Our top picks</option>
                  <option value="price-low-to-high">Price (low to high)</option>
                  <option value="price-high-to-low">Price (high to low)</option>
                  <option value="rating">Rating</option>
                </select>
              </div>
            </div>
            <PropertyCard
              searchParams={searchParams}
              filters={filters}
              sortOption={sortOption}
              onHotelClick={(hotelId) => navigate(`/property/${hotelId}`)}
            />
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default SearchResults;