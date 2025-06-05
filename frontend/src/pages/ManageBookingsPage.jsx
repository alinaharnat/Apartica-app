import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';


const ManageBookingsPage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentBookings, setCurrentBookings] = useState([]);
  const [pastBookings, setPastBookings] = useState([]);
  const [loadingCancel, setLoadingCancel] = useState(null);
  const navigate = useNavigate();


  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };


  // Format status for display
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
      case 'pending':
        return 'Pending';
      case 'confirmed':
        return 'Confirmed';
      default:
        return status;
    }
  };


  // Fetch bookings for owner's properties
  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      const url = 'http://localhost:5000/api/booking/owner';
      console.log('Fetching bookings from:', url, 'with token:', token.substring(0, 20) + '...');
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Bookings received:', {
        currentBookings: response.data.currentBookings.length,
        pastBookings: response.data.pastBookings.length,
      });
      setCurrentBookings(response.data.currentBookings || []);
      setPastBookings(response.data.pastBookings || []);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      if (error.response?.status === 401) {
        console.log('Unauthorized, clearing local storage and redirecting to login');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/auth?mode=login&redirect=/manage-bookings');
      } else {
        setError(`Failed to load bookings: ${error.response?.data?.message || error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };


  // Get refund amount for a booking
  const getRefundAmount = async (bookingId) => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching refund amount for bookingId:', bookingId);
      const response = await axios.get(`http://localhost:5000/api/booking/${bookingId}/refund-amount`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Refund amount received:', response.data.refundAmount);
      return response.data.refundAmount;
    } catch (error) {
      console.error('Failed to fetch refund amount:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch refund amount');
    }
  };


  // Cancel a booking
  const handleCancelBooking = async (bookingId) => {
    try {
      setLoadingCancel(bookingId);
      const refundAmount = await getRefundAmount(bookingId);
      const confirmMessage = `Are you sure you want to cancel this booking? The renter will be refunded €${refundAmount.toFixed(2)}.`;


      if (!window.confirm(confirmMessage)) {
        setLoadingCancel(null);
        return;
      }


      const token = localStorage.getItem('token');
      console.log('Cancelling bookingId:', bookingId);
      const response = await axios.post(
        `http://localhost:5000/api/booking/${bookingId}/cancel`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert(`Booking cancelled successfully. Refund amount: €${response.data.refundAmount.toFixed(2)}`);
      await fetchBookings();
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      alert(`Failed to cancel booking: ${error.response?.data?.message || error.message || 'Server error'}`);
    } finally {
      setLoadingCancel(null);
    }
  };


  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');


    if (!storedUser || !token) {
      console.log('No user or token in localStorage, redirecting to login');
      navigate('/auth?mode=login&redirect=/manage-bookings');
      return;
    }


    try {
      const parsedUser = JSON.parse(storedUser);
      console.log('Authenticated user:', parsedUser._id);
      setUser(parsedUser);
      fetchBookings();
    } catch (error) {
      console.error('Failed to parse user from localStorage:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      navigate('/auth?mode=login&redirect=/manage-bookings');
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


  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar user={user} />
        <main className="flex-grow container mx-auto px-4 py-8 md:px-8 lg:px-16">
          <div className="text-red-600 text-center text-lg">{error}</div>
        </main>
        <Footer />
      </div>
    );
  }


  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-grow container mx-auto px-4 py-8 md:px-8 lg:px-16">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Manage Bookings</h1>


        {/* Current Bookings */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Current Bookings</h2>
          {currentBookings.length === 0 ? (
            <p className="text-gray-600 text-center py-8 text-lg">No current bookings</p>
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
                  <p className="text-gray-600 mb-2">
                    {booking.roomId?.propertyId?.address || 'Unknown Address'}
                  </p>
                  <p className="text-gray-600 mb-2">
                    Room: {booking.roomName || `${booking.roomId?.bedrooms} bedrooms, ${booking.roomId?.bathrooms} bathrooms`}
                  </p>
                  <p className="text-gray-600 mb-2">Guest: {booking.guestFullName}</p>
                  <p className="text-gray-600 mb-2">Email: {booking.guestEmail}</p>
                  <p className="text-gray-600 mb-4">Phone: {booking.guestPhoneNumber}</p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Check-in:</p>
                      <p className="font-medium">{formatDate(booking.checkIn)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Check-out:</p>
                      <p className="font-medium">{formatDate(booking.checkOut)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Guests:</p>
                      <p className="font-medium">{booking.numberOfGuests}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total price:</p>
                      <p className="font-medium">€{booking.totalPrice.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      booking.status === 'confirmed'
                        ? 'bg-green-100 text-green-800'
                        : booking.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {formatStatus(booking.status)}
                  </span>
                  {(booking.status === 'pending' || booking.status === 'confirmed') && (
                    <button
                      onClick={() => handleCancelBooking(booking._id)}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                      disabled={loadingCancel === booking._id}
                    >
                      {loadingCancel === booking._id ? 'Cancelling...' : 'Cancel Booking'}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>


        {/* Past Bookings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Past Bookings</h2>
          {pastBookings.length === 0 ? (
            <p className="text-gray-600 text-center py-8 text-lg">No past bookings</p>
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
                    {booking.roomId?.propertyId?.title || 'Unknown Property'}
                  </h3>
                  <p className="text-gray-600">
                    {booking.roomId?.propertyId?.cityId?.name || 'Unknown City'}
                  </p>
                  <p className="text-gray-600">
                    {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                  </p>
                  <p className="text-sm text-gray-500">Total price: €{booking.totalPrice.toFixed(2)}</p>
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


export default ManageBookingsPage;