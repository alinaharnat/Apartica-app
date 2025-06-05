import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import GalleryModal from '../components/GalleryModal';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { GoogleMap, Marker } from '@react-google-maps/api';
import BaseModal from '../components/BaseModal';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const fallbackImage = '../../public/fallback.jpg';

const PropertyPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [userDetails, setUserDetails] = useState({
    name: '',
    email: '',
    phoneNumber: '',
  });
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [modalPhotos, setModalPhotos] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date(new Date().setDate(new Date().getDate() + 7));
    date.setUTCHours(0, 0, 0, 0); // Встановлюємо 00:00:00 UTC
    return date;
  });
  const [endDate, setEndDate] = useState(() => {
    const date = new Date(new Date().setDate(new Date().getDate() + 8));
    date.setUTCHours(0, 0, 0, 0); // Встановлюємо 00:00:00 UTC
    return date;
  });
  const [guests, setGuests] = useState(1);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [originalPrice, setOriginalPrice] = useState(0);
  const [isFirstBooking, setIsFirstBooking] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [error, setError] = useState(null);
  const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false);
  const [isAddReviewModalOpen, setIsAddReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [eligibleBookings, setEligibleBookings] = useState([]);
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const mapRef = useRef(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const urlGuests = parseInt(searchParams.get('guests')) || 1;
    const urlCheckIn = searchParams.get('checkIn') ? new Date(searchParams.get('checkIn')) : null;
    const urlCheckOut = searchParams.get('checkOut') ? new Date(searchParams.get('checkOut')) : null;

    console.log('Parsed URL params:', { urlGuests, urlCheckIn, urlCheckOut });

    let newStartDate = startDate;
    let newEndDate = endDate;
    let newGuests = urlGuests;

    if (urlCheckIn && !isNaN(urlCheckIn.getTime())) {
      newStartDate = new Date(urlCheckIn);
      newStartDate.setUTCHours(0, 0, 0, 0); // Нормалізуємо до UTC
      console.log('Set startDate:', newStartDate);
    }
    if (urlCheckOut && !isNaN(urlCheckOut.getTime())) {
      newEndDate = new Date(urlCheckOut);
      newEndDate.setUTCHours(0, 0, 0, 0); // Нормалізуємо до UTC
      console.log('Set endDate:', newEndDate);
    }

    setGuests(newGuests);
    setStartDate(newStartDate);
    setEndDate(newEndDate);

    const fetchAvailableRooms = async () => {
      try {
        console.log('Fetching rooms with params:', { startDate: newStartDate, endDate: newEndDate, guests: newGuests });
        const response = await axios.get(`/api/properties/${id}/available-rooms`, {
          params: {
            startDate: newStartDate.toISOString(),
            endDate: newEndDate.toISOString(),
            guests: newGuests
          },
        });
        const rooms = response.data;
        console.log('Raw rooms from API:', rooms);
        const filteredRooms = rooms.filter(room => {
          const isSuitable = room.maxGuests >= newGuests;
          console.log(`Room ${room._id}: maxGuests=${room.maxGuests}, suitable=${isSuitable}`);
          return isSuitable;
        });
        console.log('Filtered rooms:', filteredRooms);
        setAvailableRooms(filteredRooms);
        if (filteredRooms.length) {
          const cheapestRoom = filteredRooms.reduce((min, room) =>
            room.pricePerNight < min.pricePerNight ? room : min
          );
          console.log('Selected cheapest room:', cheapestRoom);
          setSelectedRoom(cheapestRoom);
        } else {
          console.log('No suitable rooms found');
          setSelectedRoom(null);
        }
      } catch (err) {
        console.error('Failed to fetch available rooms:', err);
        setError(`Failed to fetch available rooms: ${err.message}`);
      }
    };

    if (newStartDate && newEndDate && newGuests && !isNaN(newStartDate.getTime()) && !isNaN(newEndDate.getTime())) {
      fetchAvailableRooms();
    } else {
      console.log('Invalid date or guest params:', { startDate: newStartDate, endDate: newEndDate, guests: newGuests });
    }
  }, [id, location.search]);

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
    }
  }, []);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await axios.get(`/api/properties/${id}`);
        console.log('Property data:', data);
        setProperty(data);
      } catch (err) {
        console.error('Failed to fetch property:', err);
        setError(err.response?.status === 404 ? 'Property not found' : `Failed to fetch property: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id]);

  useEffect(() => {
    const fetchUserBookings = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token || !user) return;
        const headers = { Authorization: `Bearer ${token}` };
        const response = await axios.get('/api/booking/user', { headers });
        const { currentBookings, pastBookings } = response.data;
        console.log('User bookings:', { currentBookings, pastBookings });
        // Check if user has no past or current bookings
        setIsFirstBooking(currentBookings.length === 0 && pastBookings.length === 0);
      } catch (err) {
        console.error('Failed to fetch user bookings:', err);
        if (err.response?.status === 401) {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          setUser(null);
          navigate('/login');
        }
        // Do not set error state, just silently skip discount if check fails
      }
    };
    fetchUserBookings();
  }, [user, navigate]);

  useEffect(() => {
    const fetchAvailableRooms = async () => {
      try {
        console.log('Fetching rooms with params:', { startDate, endDate, guests });
        const response = await axios.get(`/api/properties/${id}/available-rooms`, {
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            guests
          },
        });
        const rooms = response.data;
        console.log('Raw rooms from API:', rooms);
        const filteredRooms = rooms.filter(room => {
          const isSuitable = room.maxGuests >= guests;
          console.log(`Room ${room._id}: maxGuests=${room.maxGuests}, suitable=${isSuitable}`, `guests: ${guests}`);
          return isSuitable;
        });
        console.log('Filtered rooms:', filteredRooms);
        setAvailableRooms(filteredRooms);
        if (filteredRooms.length) {
          const cheapestRoom = filteredRooms.reduce((min, room) =>
            room.pricePerNight < min.pricePerNight ? room : min
          );
          console.log('Selected cheapest room:', cheapestRoom);
          setSelectedRoom(cheapestRoom);
        } else {
          console.log('No suitable rooms found');
          setSelectedRoom(null);
        }
      } catch (err) {
        console.error('Failed to fetch available rooms:', err);
        setError(`Failed to fetch available rooms: ${err.message}`);
      }
    };
    if (startDate && endDate && guests && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
      fetchAvailableRooms();
    } else {
      console.log('Invalid date or guest params:', { startDate, endDate, guests });
    }
  }, [id, startDate, endDate, guests]);

  useEffect(() => {
    if (selectedRoom && endDate > startDate) {
      const nights = calculateNights(startDate, endDate);
      const basePrice = selectedRoom.pricePerNight * nights;
      setOriginalPrice(Number(basePrice.toFixed(2)));
      const discountedPrice = isFirstBooking ? basePrice * 0.9 : basePrice;
      setTotalPrice(Number(discountedPrice.toFixed(2)));
    } else {
      setOriginalPrice(0);
      setTotalPrice(0);
    }
  }, [selectedRoom, startDate, endDate, isFirstBooking]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current = null;
      }
    };
  }, []);

  const calculateNights = (start, end) => {
    const startCopy = new Date(start);
    const endCopy = new Date(end);
    startCopy.setUTCHours(0, 0, 0, 0); // Нормалізуємо до UTC
    endCopy.setUTCHours(0, 0, 0, 0); // Нормалізуємо до UTC
    const diffTime = endCopy - startCopy;
    return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  const handleReserve = () => {
    if (!selectedRoom) {
      alert('Please select a room to reserve.');
      return;
    }
    if (!user) {
      alert('You need to sign in or register on Apartica to proceed with booking.');
      return;
    }
    if (!user?.phoneNumber || user.phoneNumber.trim() === '' || !user?.dateOfBirth || !userDetails?.email) {
      alert('Please fill in all necessary profile data to book property on Apartica.');
      return;
    }
    navigate('/booking', {
      state: {
        startDate: new Date(startDate).toISOString(), // Передаємо в UTC
        endDate: new Date(endDate).toISOString(), // Передаємо в UTC
        guests,
        totalPrice,
        propertyId: id,
        selectedRoom,
        isFirstBooking,
      },
    });
  };

  const handleRoomSelect = (room) => {
    setSelectedRoom(room);
  };

  const handleAddReviewClick = async () => {
    if (!user) {
      alert('You need to sign in to add a review.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('No authentication token found. Please sign in again.');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
        navigate('/login');
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const response = await axios.get(`/api/reviews/eligible-bookings/${id}`, { headers });
      const bookings = response.data;
      console.log('Eligible bookings:', bookings);

      if (!bookings.length) {
        alert('Only users who have stayed at this property and have eligible bookings can add a review.');
        return;
      }

      setEligibleBookings(bookings);
      setSelectedBookingId(bookings[0]._id);
      setIsAddReviewModalOpen(true);
    } catch (err) {
      console.error('Failed to fetch eligible bookings:', err);
      if (err.response?.status === 401) {
        alert('Your session has expired. Please sign in again.');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
        navigate('/login');
      } else {
        alert(`Failed to verify eligibility: ${err.response?.data?.message || err.message}`);
      }
    }
  };

  const handleSubmitReview = async () => {
    const rating = parseInt(reviewRating);
    if (!rating || rating < 1 || rating > 10) {
      alert('Please enter a valid rating between 1 and 10.');
      return;
    }
    if (!selectedBookingId) {
      alert('Please select a booking.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('No authentication token found. Please sign in again.');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
        navigate('/login');
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const response = await axios.post(
        '/api/reviews',
        {
          bookingId: selectedBookingId,
          propertyId: id,
          overallRating: rating,
          comment: reviewComment.trim() || undefined,
        },
        { headers }
      );
      const newReview = response.data;
      console.log('New review added:', newReview);

      setProperty((prev) => ({
        ...prev,
        reviews: [...(prev.reviews || []), newReview],
        averageRating: newReview.averageRating || prev.averageRating,
      }));

      setReviewRating('');
      setReviewComment('');
      setSelectedBookingId(null);
      setEligibleBookings([]);
      setIsAddReviewModalOpen(false);
      alert('Review uploaded successfully!');
    } catch (err) {
      console.error('Failed to submit review:', err);
      if (err.response?.status === 401) {
        alert('Your session has expired. Please sign in again.');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
        navigate('/login');
      } else {
        alert(`Failed to submit review: ${err.response?.data?.message || err.message}`);
      }
    }
  };

  const formatReviewDate = (date) => {
    const today = new Date();
    const reviewDate = new Date(date);
    const diffTime = today - reviewDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = today.getMonth() - reviewDate.getMonth() + 12 * (today.getFullYear() - reviewDate.getFullYear());

    if (diffDays === 0) return 'Today';
    if (diffDays >= 1 && diffDays <= 6) return `${diffDays} Day${diffDays > 1 ? 's' : ''} ago`;
    if (diffWeeks >= 1 && diffWeeks <= 4) return `${diffWeeks} Week${diffWeeks > 1 ? 's' : ''} ago`;
    if (diffMonths >= 1) {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      return `${monthNames[reviewDate.getMonth()]} 20${reviewDate.getFullYear().toString().slice(-2)}`;
    }
    return reviewDate.toLocaleDateString();
  };

  const maxGuests = availableRooms.length
    ? Math.max(...availableRooms.map(room => room.maxGuests))
    : Infinity;
  const handleGuestsChange = (e) => {
    const value = parseInt(e.target.value) || 1;
    setGuests(Math.min(value, maxGuests));
  };

  if (loading) return <div className="p-4 text-center">Loading...</div>;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;
  if (!property) return <div className="p-4 text-center">Property not found.</div>;

  const mapContainerStyle = { width: '100%', height: '100%' };
  const center = property.location && property.location.latitude && property.location.longitude
    ? { lat: property.location.latitude, lng: property.location.longitude }
    : { lat: 0, lng: 0 };

  const nights = selectedRoom && endDate > startDate
    ? calculateNights(startDate, endDate)
    : 0;

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FFF8F2]">
      <Navbar user={user} />

      <main className="max-w-6xl mx-auto px-4 py-8 pt-24 space-y-4 flex-grow relative z-0">
        <div className="space-y-1">
          <p className="text-sm text-gray-500">
            {property.propertyType?.name || 'Property type not specified'}
          </p>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">{property.title}</h1>
            <button onClick={handleShare} className="p-2 rounded-full hover:bg-gray-100">
              <img src="/shareicon.svg" alt="Share" className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <img src="/mapspointer.png" alt="Location" className="w-5 h-5" />
          <p
            className="text-gray-600 cursor-pointer hover:underline"
            onClick={() => setIsMapOpen(true)}
          >
            {property.address}
          </p>
        </div>

        <div className="flex gap-6">
          <div className="w-2/3 grid grid-cols-5 gap-2">
            {property.photos?.slice(0, 8).map((photo, idx) => (
              <div
                key={photo.url}
                className={`relative cursor-pointer ${
                  idx === 0
                    ? 'col-span-3 row-span-2'
                    : idx === 1 || idx === 2
                      ? 'col-span-2 row-span-1'
                      : 'col-span-1 row-span-1'
                }`}
                onClick={() => {
                  setModalPhotos(property.photos);
                  PropertyPage.setSelectedPhotoIndex(idx);
                  setIsGalleryOpen(true);
                }}
              >
                <img
                  src={photo.url || fallbackImage}
                  alt={photo.filename || `Photo ${idx + 1}`}
                  className="rounded-md w-full h-full object-cover"
                />
                {idx === 7 && property.photos.length > 8 && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 text-white flex items-center justify-center text-lg font-medium rounded-md">
                    +{property.photos.length - 8} more
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="w-1/3 space-y-6">
            <div className="w-full bg-white p-6 rounded-xl shadow-lg z-50 mr-4">
              <div className="flex items-center mb-4 gap-2">
                <div>
                  {isFirstBooking && originalPrice > 0 ? (
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold text-gray-500 line-through">
                        €{originalPrice}
                      </p>
                      <p className="text-2xl font-bold text-green-600">
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
                    <p className="text-2xl font-bold">€{totalPrice}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">total</p>
                </div>
              </div>
              <div className="flex items-center mb-4 text-gray-700 gap-2">
                <div className="text-left">
                  <p className="text-xs uppercase text-gray-500">CHECK-IN</p>
                  <DatePicker
                    selected={startDate}
                    onChange={date => {
                      const newDate = new Date(date);
                      newDate.setUTCHours(0, 0, 0, 0); // Нормалізуємо до UTC
                      setStartDate(newDate);
                      if (newDate >= endDate) {
                        const newEndDate = new Date(newDate);
                        newEndDate.setDate(newEndDate.getDate() + 1);
                        newEndDate.setUTCHours(0, 0, 0, 0); // Нормалізуємо до UTC
                        setEndDate(newEndDate);
                      }
                    }}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    minDate={new Date()}
                    className="text-gray-700 cursor-pointer"
                    customInput={<span>{startDate.toLocaleDateString()}</span>}
                  />
                </div>
                <span className="text-3xl text-gray-700 leading-none mx-4">|</span>
                <div className="text-left">
                  <p className="text-xs uppercase text-gray-500">CHECKOUT</p>
                  <DatePicker
                    selected={endDate}
                    onChange={date => {
                      const newDate = new Date(date);
                      newDate.setUTCHours(0, 0, 0, 0); // Нормалізуємо до UTC
                      setEndDate(newDate || new Date(startDate.getTime() + 24 * 60 * 60 * 1000));
                    }}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={new Date(startDate.getTime() + 24 * 60 * 60 * 1000)}
                    className="text-gray-700 cursor-pointer"
                    customInput={<span>{endDate.toLocaleDateString()}</span>}
                  />
                </div>
              </div>
              <div className="text-left mb-4">
                <p className="text-xs uppercase text-gray-500">GUESTS</p>
                <input
                  type="number"
                  value={guests}
                  onChange={handleGuestsChange}
                  min="1"
                  max={maxGuests}
                  className="text-gray-700 cursor-pointer"
                  style={{ display: 'inline', width: 'auto', border: 'none' }}
                />
              </div>
              <button
                onClick={handleReserve}
                className={`w-full py-3 rounded-lg font-semibold transition text-white ${
                  selectedRoom && property.isListed !== false
                    ? 'bg-[#8252A1] hover:bg-[#6f4587]'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
                disabled={!selectedRoom || property.isListed === false}
              >
                Reserve
              </button>
            </div>

            <div className="w-full h-64">
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={center}
                zoom={15}
                onLoad={map => {
                  mapRef.current = map;
                }}
                onUnmount={() => {
                  mapRef.current = null;
                }}
                onClick={() => setIsMapOpen(true)}
                options={{
                  disableDefaultUI: true,
                }}
              >
                <Marker position={center} />
              </GoogleMap>
            </div>
          </div>
        </div>

        <BaseModal isOpen={isMapOpen} onClose={() => setIsMapOpen(false)}>
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '500px' }}
            center={center}
            zoom={15}
            onLoad={map => {
              mapRef.current = map;
            }}
            onUnmount={() => {
              mapRef.current = null;
            }}
          >
            <Marker position={center} />
          </GoogleMap>
        </BaseModal>

        <div className="w-2/3 flex flex-wrap gap-3 mt-4">
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

        <div className="flex gap-6 mt-4">
          <div className="w-2/3">
            <h2 className="text-2xl font-semibold h-8 flex items-center leading-none mb-4">Information</h2>
            <p className="text-gray-700">{property.description}</p>
          </div>
          <div className="w-1/3 flex justify-end">
            <div className="flex items-center gap-2 h-8 leading-none">
              <img src="/ratingicon.png" alt="Rating" className="w-6 h-6" />
              <span className="text-xl font-semibold">{property.averageRating.toFixed(1)}</span>
              <span className="text-gray-600">/10</span>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <h2 className="text-2xl font-semibold mb-4">Available Room Types</h2>
          {availableRooms.length > 0 ? (
            <div className="grid grid-cols-3 gap-4">
              {availableRooms.map(room => (
                <div
                  key={room._id}
                  className={`border rounded-lg p-4 shadow-sm bg-white flex items-center gap-4 cursor-pointer ${
                    selectedRoom?._id === room._id ? 'border-blue-500 border-2' : 'border-gray-200'
                  }`}
                  onClick={() => handleRoomSelect(room)}
                >
                  <img
                    src={room.photos[0]?.url || fallbackImage}
                    alt="Room"
                    className="w-24 h-24 object-cover rounded-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      setModalPhotos(room.photos);
                      setSelectedPhotoIndex(0);
                      setIsGalleryOpen(true);
                    }}
                  />
                  <div className="flex-1">
                    <p className="font-semibold">{room.bedrooms} bedroom(s)</p>
                    <p>{room.bathrooms} bathroom(s)</p>
                    <p>👤 x{room.maxGuests}</p>
                    <div className="flex justify-between items-center">
                      <p className="text-blue-600 font-semibold">
                        €{Number((room.pricePerNight * nights).toFixed(2))}
                      </p>
                      <p className="text-gray-500 text-sm">
                        (€{room.pricePerNight}/night)
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-red-500">No rooms available for the selected options.</p>
          )}
        </div>

        <div className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Guest Reviews</h2>
            <button
              onClick={handleAddReviewClick}
              className="text-black font-bold underline"
            >
              Add Review
            </button>
          </div>
          {property.reviews?.length > 0 ? (
            <div className="flex gap-4">
              {[...property.reviews]
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 2)
                .map(review => (
                  <div key={review._id} className="w-1/2 border rounded-lg p-4 shadow-sm bg-white">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-medium">{review.userDisplayName}</p>
                      <p className="text-gray-500 text-sm">{formatReviewDate(review.createdAt)}</p>
                    </div>
                    <p className="text-gray-700">{review.comment}</p>
                    <p className="mt-2">Rating: {review.rating}/10</p>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">
              This property has not received any reviews yet. But you can add one, if you have already stayed here.
            </p>
          )}
          {property.reviews?.length > 2 && (
            <button
              onClick={() => setIsReviewsModalOpen(true)}
              className="mt-4 text-black font-bold underline text-center block mx-auto"
            >
              Show all {property.reviews.length} reviews
            </button>
          )}
        </div>

        <BaseModal isOpen={isReviewsModalOpen} onClose={() => setIsReviewsModalOpen(false)}>
          <div className="max-h-[70vh] overflow-y-auto">
            <h2 className="text-2xl font-semibold mb-4">All Reviews</h2>
            <div className="space-y-4">
              {[...property.reviews]
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .map(review => (
                  <div key={review._id} className="border rounded-lg p-4 shadow-sm bg-white">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-medium">{review.userDisplayName}</p>
                      <p className="text-gray-500 text-sm">{formatReviewDate(review.createdAt)}</p>
                    </div>
                    <p className="text-gray-700">{review.comment}</p>
                    <p className="mt-2">Rating: {review.rating}/10</p>
                  </div>
                ))}
            </div>
          </div>
        </BaseModal>

        <BaseModal isOpen={isAddReviewModalOpen} onClose={() => setIsAddReviewModalOpen(false)}>
          <div className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Add Your Review</h2>
            <div className="space-y-4">
              {eligibleBookings.length > 1 && (
                <div>
                  <label className="block text-gray-700 mb-1">Select Booking</label>
                  <select
                    value={selectedBookingId}
                    onChange={(e) => setSelectedBookingId(e.target.value)}
                    className="w-full border rounded-lg p-2"
                  >
                    {eligibleBookings.map(booking => (
                      <option key={booking._id} value={booking._id}>
                        {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-gray-700 mb-1">Rating (1–10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={reviewRating}
                  onChange={(e) => setReviewRating(e.target.value)}
                  className="w-full border rounded-lg p-2"
                  placeholder="Enter rating"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Comment (optional)</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full border rounded-lg p-2"
                  rows="4"
                  placeholder="Share your experience"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsAddReviewModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReview}
                  className="px-4 py-2 bg-[#8252A1] text-white rounded-lg hover:bg-[#6f4587]"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </BaseModal>

        <div className="mt-4">
          <h2 className="text-2xl font-semibold mb-4">House Rules</h2>
          <ul className="space-y-3 text-gray-700">
            {property.rules?.map(rule => (
              <li key={rule._id} className="flex">
                <span className="font-bold inline-block w-40 flex-shrink-0">{rule.category?.name}:</span>
                <span>{rule.value}</span>
              </li>
            ))}
          </ul>
        </div>

        <GalleryModal
          isOpen={isGalleryOpen}
          onClose={() => setIsGalleryOpen(false)}
          photos={modalPhotos}
          startIndex={selectedPhotoIndex}
        />
      </main>

      <Footer />
    </div>
  );
};

export default PropertyPage;