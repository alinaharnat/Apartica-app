import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Users, MessageSquare, Building } from 'lucide-react';

const ModeratorHomePage = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const userData = JSON.parse(stored);
      if (userData.isBlocked) {
        navigate('/');
        // Optionally set notification via a global state (e.g., Redux) or URL param
      } else if (userData.userType.includes('Moderator')) {
        setUser(userData);
        fetchUsers();
      } else {
        navigate('/');
      }
    } else {
      navigate('/auth');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  if (!user) {
    return <div className="p-8 text-center">Loading moderator page...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gray-100">
      <Navbar user={user} />

      <main className="flex-grow flex flex-col items-center p-8 pt-32">
        <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-purple-500 to-pink-500 text-transparent bg-clip-text mb-2">
          Welcome, Moderator!
        </h1>
        <p className="text-lg text-gray-600 mb-16 text-center">
          This is your moderator dashboard.
        </p>

        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            onClick={() => navigate('/moderator/users')}
            className="cursor-pointer bg-white shadow-md p-6 rounded-2xl hover:shadow-lg transition group text-center"
          >
            <Users className="h-10 w-10 mx-auto text-blue-500 group-hover:scale-110 transition" />
            <h3 className="text-xl font-semibold mt-4">Manage Users</h3>
            <p className="text-gray-600 mt-2">Block or unblock users in the system.</p>
          </div>

          <div
            onClick={() => navigate('/moderator/reviews')}
            className="cursor-pointer bg-white shadow-md p-6 rounded-2xl hover:shadow-lg transition group text-center"
          >
            <MessageSquare className="h-10 w-10 mx-auto text-purple-500 group-hover:scale-110 transition" />
            <h3 className="text-xl font-semibold mt-4">Manage Reviews</h3>
            <p className="text-gray-600 mt-2">View and moderate user reviews.</p>
          </div>

          <div
            onClick={() => navigate('/moderator/properties')}
            className="cursor-pointer bg-white shadow-md p-6 rounded-2xl hover:shadow-lg transition group text-center"
          >
            <Building className="h-10 w-10 mx-auto text-green-500 group-hover:scale-110 transition" />
            <h3 className="text-xl font-semibold mt-4">Manage Properties</h3>
            <p className="text-gray-600 mt-2">List or delete properties.</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ModeratorHomePage;