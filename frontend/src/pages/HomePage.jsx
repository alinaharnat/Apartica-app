import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const HomePage = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Navbar user={user} />
      <main className="flex-grow p-4 text-center">
        <h1 className="text-3xl font-bold mb-4">Вітаємо в Apartica</h1>
        <p>На цій сторінці з’явиться домашній контент</p>
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;