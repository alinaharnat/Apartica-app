import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BookingsPage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentBookings, setCurrentBookings] = useState([]);
  const [pastBookings, setPastBookings] = useState([]);
  const navigate = useNavigate();

  // Форматування дати
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Форматування статусу для відображення
  const formatStatus = (status) => {
    switch (status) {
      case 'cancelled_by_renter':
        return 'Cancelled by Renter';
      case 'cancelled_by_owner':
        return 'Cancelled by Owner';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  };

  // Отримання бронювань з бекенду
  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/booking/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentBookings(response.data.currentBookings);
      setPastBookings(response.data.pastBookings);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/auth?mode=login&redirect=/bookings');
      }
    } finally {
      setLoading(false);
    }
  };

  // Отримання суми повернення
  const getRefundAmount = async (bookingId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/booking/${bookingId}/refund-amount`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.refundAmount;
    } catch (error) {
      console.error('Failed to fetch refund amount:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch refund amount');
    }
  };

  // Скасування бронювання
  const handleCancelBooking = async (bookingId) => {
    try {
      // Отримуємо суму повернення
      const refundAmount = await getRefundAmount(bookingId);
      const confirmMessage = `Are you sure you want to cancel this booking? You will be refunded €${refundAmount.toFixed(2)}.`;

      if (!window.confirm(confirmMessage)) {
        return;
      }

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/booking/${bookingId}/cancel`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert(`Booking cancelled successfully. Refund amount: €${response.data.refundAmount.toFixed(2)}`);
      await fetchBookings();
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      alert(`Failed to cancel booking: ${error.message || error.response?.data?.message || 'Server error'}`);
    }
  };

  // Ініціалізація компонента
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!storedUser || !token) {
      navigate('/auth?mode=login&redirect=/bookings');
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchBookings();
    } catch (error) {
      console.error('Failed to parse user from localStorage:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      navigate('/auth?mode=login&redirect=/bookings');
    }
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8 md:px-8 lg:px-16 flex items-center justify-center">
          <div className="animate-pulse">Loading...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />

      <main className="flex-grow container mx-auto px-4 py-8 md:px-8 lg:px-16">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Bookings</h1>

        {/* Current Bookings */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Current Bookings</h2>
          {currentBookings.length === 0 ? (
            <p className="text-gray-600">No current bookings</p>
          ) : (
            currentBookings.map((booking) => (
              <div
                key={booking._id}
                className="bg-white rounded-lg shadow-md p-6 mb-4 flex justify-between items-center"
              >
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {booking.roomId?.propertyId?.title || 'Unknown Property'}
                  </h3>
                  <p className="text-gray-600 mb-2">{booking.roomId?.propertyId?.address || 'Unknown Address'}</p>
                  <p className="text-gray-600 mb-4">Guest: {booking.guestFullName}</p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Date of arrival:</p>
                      <p className="font-medium">{formatDate(booking.checkIn)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Departure date:</p>
                      <p className="font-medium">{formatDate(booking.checkOut)}</p>
                    </div>
                  </div>
                </div>
                <button
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  onClick={() => handleCancelBooking(booking._id)}
                >
                  Cancel
                </button>
              </div>
            ))
          )}
        </div>

        {/* Past Bookings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Past Bookings</h2>
          {pastBookings.length === 0 ? (
            <p className="text-gray-600">No past bookings</p>
          ) : (
            pastBookings.map((booking, index) => (
              <div
                key={booking._id}
                className={`py-4 flex justify-between items-center ${
                  index !== pastBookings.length - 1 ? 'border-b border-gray-200' : ''
                }`}
              >
                <div>
                  <h3 className="font-medium text-gray-800">
                    {booking.roomId?.propertyId?.cityId?.name || 'Unknown City'}
                  </h3>
                  <p className="text-gray-600">
                    {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    booking.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800 opacity-75'
                  }`}
                >
                  {formatStatus(booking.status)}
                </span>
              </div>
            ))
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BookingsPage;