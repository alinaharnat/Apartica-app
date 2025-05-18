// src/pages/HomePage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Hero from '../components/Hero';
import PopularCities from '../components/PopularCities';
import NewCustomerDiscount from '../components/NewCustomerDiscount';

const HomePage = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const userData = JSON.parse(stored);
      setUser(userData);
      
      // Если пользователь администратор - перенаправляем в админку
      if (userData.userType.includes('Administrator')) {
        navigate('/admin');
      }
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FFF8F2]">
      <Navbar user={user} />
      <Hero />
      <main className="flex-grow p-4 text-center">
        <h1 className="text-3xl font-bold mb-4">Welcome to Apartica</h1>
        <p>Home content will appear on this page</p>
      </main>
      <div className="mb-10">
        <PopularCities />
      </div>
      <div className="mb-10">
          {!user && <NewCustomerDiscount />}
      </div>
      <Footer />
    </div>
  );
};

export default HomePage;