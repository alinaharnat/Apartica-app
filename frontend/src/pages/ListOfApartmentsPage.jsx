import React, { useState } from 'react';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';


// Sample apartment data
const apartments = [
  { id: 1, name: 'Maidan Palace Hotel', location: 'Ibis Kylv Railway', price: 62, image: 'https://via.placeholder.com/300x200' },
  { id: 2, name: 'Radisson Blu Hotel, City Centre', location: 'Ibis Kylv Railway', price: 67, image: 'https://via.placeholder.com/300x200' },
  { id: 3, name: 'InterContinental - Kyiv by IHC', location: 'Wonderful', price: 74, image: 'https://via.placeholder.com/300x200' },
  { id: 4, name: 'Radisson Blu Hotel, Podil City Centre', location: 'Ibis Kylv Railway', price: 78, image: 'https://via.placeholder.com/300x200' },
];


const ListOfApartmentsPage = () => {
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [propertyType, setPropertyType] = useState([]);
  const [guestRating, setGuestRating] = useState('');


  const handlePriceChange = (e) => {
    setPriceRange([e.target.value, priceRange[1]]);
  };


  const handlePropertyTypeChange = (e) => {
    const value = e.target.value;
    setPropertyType(
      propertyType.includes(value)
        ? propertyType.filter((type) => type !== value)
        : [...propertyType, value]
    );
  };


  const handleGuestRatingChange = (e) => {
    setGuestRating(e.target.value);
  };


  return (
    <div>


   <Navbar />
    <div className="min-h-screen bg-gray-100 flex">
      {/* Filter Section */}
      <div className="w-1/4 p-4 bg-white shadow-md">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>


        {/* Price Range Filter */}
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-2">Price Range</h3>
          <input
            type="range"
            min="0"
            max="1000"
            value={priceRange[0]}
            onChange={handlePriceChange}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-600">
            <span>€{priceRange[0]}</span>
            <span>€{priceRange[1]}</span>
          </div>
        </div>


        {/* Property Type Filter */}
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-2">Property Type</h3>
          <label className="block mb-2">
            <input
              type="checkbox"
              value="Apartment"
              onChange={handlePropertyTypeChange}
              className="mr-2"
            />
            Apartment
          </label>
          <label className="block mb-2">
            <input
              type="checkbox"
              value="Hotel"
              onChange={handlePropertyTypeChange}
              className="mr-2"
            />
            Hotel
          </label>
          <label className="block mb-2">
            <input
              type="checkbox"
              value="Hostel"
              onChange={handlePropertyTypeChange}
              className="mr-2"
            />
            Hostel
          </label>
        </div>


        {/* Guest Rating Filter */}
        <div>
          <h3 className="text-sm font-medium mb-2">Guest Rating</h3>
          <select
            value={guestRating}
            onChange={handleGuestRatingChange}
            className="w-full p-2 border rounded"
          >
            <option value="">Any</option>
            <option value="Wonderful">Wonderful (9+)</option>
            <option value="Very Good">Very Good (8+)</option>
            <option value="Good">Good (7+)</option>
          </select>
        </div>
      </div>


      {/* Apartment Listings */}
      <div className="w-3/4 p-4">
        <h1 className="text-xl font-bold mb-4">Kyiv: Over 3000 places in Kyiv</h1>
        <div className="space-y-4">
          {apartments.map((apartment) => (
            <div key={apartment.id} className="flex bg-white shadow-md rounded-lg overflow-hidden">
              <img
                src={apartment.image}
                alt={apartment.name}
                className="w-1/3 h-48 object-cover"
              />
              <div className="p-4 flex-1">
                <h2 className="text-lg font-semibold text-purple-700">{apartment.name}</h2>
                <p className="text-sm text-gray-600">{apartment.location}</p>
                <p className="text-xl font-bold mt-2">€{apartment.price}</p>
                <button className="mt-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
                  See Options
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    <Footer />
</div>
  );
};


export default ListOfApartmentsPage;