import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';

const BookingsPage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Test data - will be replaced with data from your database
  const currentBooking = {
    hotelName: "ibis Kyiv Railway Station",
    address: "6 Sicheslavska Street, Kyiv, 03049, Ukraine",
    arrivalDate: "2025-04-20",
    departureDate: "2025-04-26"
  };

  const pastBookings = [
    { city: "Kyiv", checkIn: "2025-03-27", checkOut: "2025-03-28" },
    { city: "Odesa", checkIn: "2025-02-20", checkOut: "2025-02-21" }
  ];

  // Format date for display (e.g., "2025-04-20" -> "Apr 20")
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

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
    } catch (error) {
      console.error("Failed to parse user from localStorage:", error);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      navigate('/auth?mode=login&redirect=/bookings');
    } finally {
      setLoading(false);
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
        
        {/* Current Booking */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">{currentBooking.hotelName}</h2>
          <p className="text-gray-600 mb-4">{currentBooking.address}</p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div>
              <p className="text-sm text-gray-500">Date of arrival:</p>
              <p className="font-medium">{formatDate(currentBooking.arrivalDate)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Departure date:</p>
              <p className="font-medium">{formatDate(currentBooking.departureDate)}</p>
            </div>
          </div>
        </div>

        {/* Past Bookings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Past Bookings</h2>
          
          {pastBookings.map((booking, index) => (
            <div 
              key={index} 
              className={`py-4 ${index !== pastBookings.length - 1 ? 'border-b border-gray-200' : ''}`}
            >
              <h3 className="font-medium text-gray-800">{booking.city}</h3>
              <p className="text-gray-600">
                {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
              </p>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BookingsPage;