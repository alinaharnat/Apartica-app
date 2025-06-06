import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Users, Building, CalendarCheck, LogOut } from 'lucide-react';
import axios from 'axios';

const AdminHomePage = () => {
  const [user, setUser] = useState(null);
  const [notification, setNotification] = useState(null); // State for notification
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const userData = JSON.parse(stored);
      if (userData.isBlocked) {
        // User is blocked, log out and show notification
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setNotification('Your account has been blocked. Please contact support for assistance.');
        navigate('/');
      } else if (userData.userType.includes('Administrator')) {
        setUser(userData);
        // Optionally fetch data if needed (e.g., fetchUsers), but not required for this page
      } else {
        navigate('/');
      }
    } else {
      navigate('/auth');
    }
  }, [navigate]);

  // Dismiss notification
  const dismissNotification = () => {
    setNotification(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-gray-100">
        <Navbar user={null} />
        {notification && (
          <div className="fixed top-0 left-0 w-full bg-red-600 text-white p-4 text-center z-50">
            {notification}
            <button
              onClick={dismissNotification}
              className="ml-4 text-white underline"
            >
              Dismiss
            </button>
          </div>
        )}
        <main className="flex-grow flex items-center justify-center p-8">
          <p className="text-center">Loading admin page...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gray-100">
      <Navbar user={user} />

      {notification && (
        <div className="fixed top-0 left-0 w-full bg-red-600 text-white p-4 text-center z-50">
          {notification}
          <button
            onClick={dismissNotification}
            className="ml-4 text-white underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <main className="flex-grow flex flex-col items-center p-8 pt-32">
        <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-purple-500 to-pink-500 text-transparent bg-clip-text mb-2">
          Welcome, Admin!
        </h1>
        <p className="text-lg text-gray-600 mb-16 text-center">
          This is your administrator dashboard.
        </p>

        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            onClick={() => navigate('/admin/users')}
            className="cursor-pointer bg-white shadow-md p-6 rounded-2xl hover:shadow-lg transition group text-center"
          >
            <Users className="h-10 w-10 mx-auto text-blue-500 group-hover:scale-110 transition" />
            <h3 className="text-xl font-semibold mt-4">Manage Users</h3>
            <p className="text-gray-600 mt-2">View, edit, or remove users from the system.</p>
          </div>

          <div
            onClick={() => navigate('/admin/properties')}
            className="cursor-pointer bg-white shadow-md p-6 rounded-2xl hover:shadow-lg transition group text-center"
          >
            <Building className="h-10 w-10 mx-auto text-green-500 group-hover:scale-110 transition" />
            <h3 className="text-xl font-semibold mt-4">Manage Properties</h3>
            <p className="text-gray-600 mt-2">Approve, edit, or delete listed properties.</p>
          </div>

          <div
            onClick={() => navigate('/admin/bookings')}
            className="cursor-pointer bg-white shadow-md p-6 rounded-2xl hover:shadow-lg transition group text-center"
          >
            <CalendarCheck className="h-10 w-10 mx-auto text-purple-500 group-hover:scale-110 transition" />
            <h3 className="text-xl font-semibold mt-4">Manage Bookings</h3>
            <p className="text-gray-600 mt-2">Track and manage booking requests.</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminHomePage;