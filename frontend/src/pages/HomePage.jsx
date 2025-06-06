import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Hero from '../components/Hero';
import PopularCities from '../components/PopularCities';
import NewCustomerDiscount from '../components/NewCustomerDiscount';
import HotelCard from '../components/HotelCard';
import { useAuth } from '../hooks/useAuth'; // Adjust path as needed

const HomePage = () => {
  const { user, notification, dismissNotification } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.userType.includes('Administrator')) {
        console.log('Redirecting to /admin'); // Debug log
        navigate('/admin');
      } else if (user.userType.includes('Moderator')) {
        console.log('Redirecting to /moderator'); // Debug log
        navigate('/moderator');
      }
    }
  }, [user, navigate]);

  console.log('HomePage - Current user state:', user); // Debug log

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FFF8F2]">
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
      <Hero />
      <main className="flex-grow p-4 text-center">
        {/* Main content */}
      </main>
      <div>
        <PopularCities />
      </div>
      <HotelCard />
      <div className="mb-5">
        {!user && <NewCustomerDiscount />}
      </div>
      <Footer />
    </div>
  );
};

export default HomePage;