import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const BookingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Відновлюємо state із localStorage, якщо location.state відсутній
  const storedState = localStorage.getItem('bookingState');
  const state = location.state || (storedState ? JSON.parse(storedState) : null);

  const { startDate, endDate, guests, totalPrice, propertyId, selectedRoom, isFirstBooking } = state || {};

  const [user, setUser] = useState(null);
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userDetails, setUserDetails] = useState({
    name: '',
    email: '',
    phoneNumber: '',
  });
  const [guestFullName, setGuestFullName] = useState('');
  const queryParams = new URLSearchParams(location.search);
  const paymentStatus = queryParams.get('payment');

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const parsedUser = JSON.parse(stored);
      setUser(parsedUser);
      setUserDetails({
        name: parsedUser.name || `${parsedUser.firstName || ''} ${parsedUser.lastName || ''}`.trim(),
        email: parsedUser.email || '',
        phoneNumber: parsedUser.phoneNumber || '',
      });
    } else {
      setError('User not logged in');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const { data } = await axios.get(`/api/properties/${propertyId}`);
        setProperty(data);
      } catch (err) {
        console.error('Failed to fetch property:', err);
        setError('Failed to fetch property');
      } finally {
        setLoading(false);
      }
    };

    if (propertyId) {
      fetchProperty();
    } else {
      setError('Booking data is missing. Please start a new booking.');
      setLoading(false);
    }
  }, [propertyId]);

  // Якщо платіж скасовано, але state є, зберігаємо його для повторного використання
  useEffect(() => {
    if (paymentStatus === 'cancelled' && state) {
      localStorage.setItem('bookingState', JSON.stringify(state));
    }
  }, [paymentStatus, state]);

  const handleUserDetailsChange = (e) => {
    const { name, value } = e.target;
    setUserDetails(prev => ({ ...prev, [name]: value }));
  };

  const handlePhoneNumberChange = (e) => {
    const value = e.target.value;
    const cleanedValue = value.replace(/[^\d+]/g, '');
    if (/^\+?\d{0,14}$/.test(cleanedValue)) {
      setUserDetails(prev => ({ ...prev, phoneNumber: cleanedValue }));
    } else if (cleanedValue.length > 15) {
      alert('Phone number must not exceed 15 digits (plus optional + at the start).');
    }
  };

  const handlePayment = async (paymentMethod) => {
    if (!guestFullName) {
      alert('Please enter the full guest name.');
      return;
    }

    // Зберігаємо state у localStorage перед відправленням на Stripe
    const bookingState = {
      startDate,
      endDate,
      guests,
      totalPrice,
      propertyId,
      selectedRoom,
      isFirstBooking,
    };
    localStorage.setItem('bookingState', JSON.stringify(bookingState));

    try {
      const response = await axios.post('/api/booking/create', {
        propertyId,
        roomId: selectedRoom._id,
        startDate,
        endDate,
        guests,
        totalPrice,
        guestFullName,
        paymentMethod,
        userDetails,
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (paymentMethod === 'stripe') {
        window.location.href = response.data.url; // Перенаправлення на сторінку оплати Stripe
      }
    } catch (err) {
      console.error('Failed to initiate payment:', err.response ? err.response.data : err.message);
      alert(`Failed to initiate payment: ${err.response?.data?.message || err.message}`);
    }
  };

  // Якщо state відсутній, перенаправляємо на головну сторінку
  if (!state || !propertyId || !selectedRoom) {
    if (!loading && error) {
      setTimeout(() => navigate('/'), 3000); // Перенаправлення через 3 секунди після показу помилки
      return (
        <div className="min-h-screen flex flex-col justify-between bg-[#FFF8F2]">
          <Navbar user={user} />
          <main className="max-w-6xl mx-auto px-4 py-8 pt-24 flex-grow text-center">
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-4">
              <strong className="font-bold">Error: </strong>
              <span>{error}</span>
            </div>
            <p className="text-gray-600">Redirecting to homepage in 3 seconds...</p>
          </main>
          <Footer />
        </div>
      );
    }
    return null; // Поки завантажується, нічого не рендеримо
  }

  if (loading) return <div className="p-4 text-center">Loading...</div>;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;

  const nights = Math.max(0, Math.floor((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)));
  const roomName = `${selectedRoom.bedrooms} Bedroom${selectedRoom.bedrooms > 1 ? 's' : ''}, ${selectedRoom.bathrooms} Bathroom${selectedRoom.bathrooms > 1 ? 's' : ''}`;
  const originalPrice = selectedRoom.pricePerNight * nights;

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FFF8F2]">
      <Navbar user={user} />

      <main className="max-w-6xl mx-auto px-4 py-8 pt-24 flex gap-6 flex-grow">
        {/* Лівий блок: Деталі помешкання та бронювання */}
        <div className="w-1/2 space-y-6">
          <h1 className="text-3xl font-bold">Confirm and Pay</h1>

          {/* Повідомлення про скасування платежу */}
          {paymentStatus === 'cancelled' && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
              <strong className="font-bold">Payment Cancelled: </strong>
              <span>Your payment was cancelled. Please try again.</span>
            </div>
          )}

          {/* Деталі помешкання */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-2">{property.propertyType?.name}</h2>
            <p className="text-lg font-medium">{property.title}</p>
            <p className="text-gray-600">
              {property.address}
              {property.city?.name ? `, ${property.city.name}` : ''}
              {property.city?.country?.name ? `, ${property.city.country.name}` : ''}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xl font-semibold">{property.averageRating.toFixed(1)}</span>
              <span className="text-gray-600">/10</span>
              <span className="text-gray-600">({property.reviews.length} reviews)</span>
            </div>
            <div className="flex flex-wrap gap-3 mt-4">
              {property.amenities?.map(amenity => (
                <span
                  key={amenity._id}
                  className="flex items-center bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-full gap-2"
                >
                  <img src={amenity.icon} alt={amenity.name} className="w-5 h-5" />
                  {amenity.name}
                </span>
              ))}
            </div>
          </div>

          {/* Деталі бронювання */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Your Trip</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <p className="font-medium">Check-In:</p>
                <p>{new Date(startDate).toLocaleDateString()}</p>
              </div>
              <div className="flex justify-between">
                <p className="font-medium">Check-Out:</p>
                <p>{new Date(endDate).toLocaleDateString()}</p>
              </div>
              <div className="flex justify-between">
                <p className="font-medium">Duration:</p>
                <p>{nights} night{nights > 1 ? 's' : ''}</p>
              </div>
              <div className="flex justify-between">
                <p className="font-medium">Guests:</p>
                <p>{guests}</p>
              </div>
            </div>
            <div className="mt-4">
              {isFirstBooking && originalPrice > 0 ? (
                <div className="flex items-center gap-2">
                  <p className="text-xl font-bold text-black-500">
                    Total:
                  </p>
                  <p className="text-xl font-bold text-gray-500 line-through">
                    €{Number(originalPrice.toFixed(2))}
                  </p>
                  <p className="text-xl font-bold text-green-600">
                    €{totalPrice}
                  </p>
                  <div className="relative group">
                    <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-700 text-xs flex items-center justify-center cursor-help">
                      ?
                    </span>
                    <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded p-2 w-40 -left-10 top-6 z-10">
                      First booking discount: 10% off your first stay!
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xl font-bold">€{totalPrice}</p>
              )}
            </div>
          </div>

          {/* Price Information */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Price Information</h2>
            {isFirstBooking && originalPrice > 0 ? (
              <div className="space-y-2">
                <p>
                  €{selectedRoom.pricePerNight} per night × {nights} night{nights > 1 ? 's' : ''} = €{Number(originalPrice.toFixed(2))}
                </p>
                <p className="text-green-600">
                  First booking discount (10% off): -€{Number((originalPrice - totalPrice).toFixed(2))}
                </p>
                <p className="font-semibold">
                  Total after discount: €{totalPrice}
                </p>
              </div>
            ) : (
              <p>
                €{selectedRoom.pricePerNight} per night × {nights} night{nights > 1 ? 's' : ''} = €{totalPrice}
              </p>
            )}
          </div>
        </div>

        {/* Правий блок: Оформлення бронювання */}
        <div className="w-1/2 space-y-6">
          {/* Деталі користувача */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Your Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  name="name"
                  value={userDetails.name}
                  onChange={handleUserDetailsChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  value={userDetails.email}
                  onChange={handleUserDetailsChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={userDetails.phoneNumber}
                  onChange={handlePhoneNumberChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  placeholder="Enter phone number (e.g., +380123456789)"
                  required
                />
              </div>
            </div>
          </div>

          {/* Назва кімнати та правила */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Room and House Rules</h2>
            <p className="text-lg font-medium mb-2">{roomName}</p>
            <ul className="space-y-3 text-gray-700">
              {property.rules?.map(rule => (
                <li key={rule._id} className="flex">
                  <span className="font-bold inline-block w-40 flex-shrink-0">{rule.category?.name}:</span>
                  <span>{rule.value}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Full Guest Name */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Full Guest Name</h2>
            <input
              type="text"
              value={guestFullName}
              onChange={(e) => setGuestFullName(e.target.value)}
              className="block w-full border border-gray-300 rounded-md p-2"
              placeholder="Enter full name as per passport"
              required
            />
          </div>

          {/* Choose Payment Method */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Choose Payment Method</h2>
            <div className="space-y-3">
              <button
                onClick={() => handlePayment('stripe')}
                className="w-full py-3 rounded-lg font-semibold transition text-white bg-[#8252A1] hover:bg-[#6f4587]"
              >
                Pay with Stripe
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BookingPage;