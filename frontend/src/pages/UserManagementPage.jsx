import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';

const UserManagementPage = () => {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const userData = JSON.parse(stored);
      if (userData.userType.includes('Administrator')) {
        setUser(userData);
        fetchUsers();
      } else {
        navigate('/');
      }
    } else {
      navigate('/auth');
    }
  }, [navigate]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load users');
      setLoading(false);
    }
  };

  const toggleBlockUser = async (userId, isBlocked) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `/api/admin/users/${userId}/block`,
        { isBlocked: !isBlocked },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUsers();
    } catch (err) {
      alert('Error updating user status');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar user={user} onLogout={handleLogout} />

      <main className="flex-grow pt-28 px-6 md:px-12">
        <h1 className="text-3xl font-bold mb-6 text-center">User Management</h1>

        {loading ? (
          <p className="text-center">Loading users...</p>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded shadow">
              <thead>
                <tr className="bg-gray-200 text-left">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="border-t">
                    <td className="py-2 px-4">{user.displayName || user.name}</td>
                    <td className="py-2 px-4">{user.email}</td>
                    <td className="py-2 px-4">{user.userType.join(', ')}</td>
                    <td className="py-2 px-4">
                      {user.isBlocked ? (
                        <span className="text-red-600 font-semibold">Blocked</span>
                      ) : (
                        <span className="text-green-600 font-semibold">Active</span>
                      )}
                    </td>
                    <td className="py-2 px-4">
                      <button
                        onClick={() => toggleBlockUser(user._id, user.isBlocked)}
                        className={`px-3 py-1 rounded text-white ${
                          user.isBlocked
                            ? 'bg-green-500 hover:bg-green-600'
                            : 'bg-red-500 hover:bg-red-600'
                        }`}
                      >
                        {user.isBlocked ? 'Unblock' : 'Block'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default UserManagementPage;
