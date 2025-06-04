import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const MyPropertiesPage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };

      const response = await axios.get(`http://localhost:5000/api/properties/user/${user.userId}`, config);
      setProperties(response.data);
    } catch (error) {
      console.error('Failed to fetch properties:', error);
      setError(error.response?.data?.message || 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (propertyId, action) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      switch (action) {
        case 'view':
          navigate(`/property/${propertyId}`);
          break;
        case 'delete':
          if (window.confirm('Are you sure you want to delete this property?')) {
            await axios.delete(`http://localhost:5000/api/properties/${propertyId}`, config);
            alert('Property deleted successfully!');
            await fetchProperties();
          }
          break;
        default:
          break;
      }
    } catch (error) {
      console.error(`Failed to ${action} property:`, error);
      alert(`Failed to ${action} property: ${error.response?.data?.message || 'Server error'}`);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!storedUser || !token) {
      navigate('/auth?mode=login&redirect=/my-properties');
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
    } catch (error) {
      console.error('Failed to parse user from localStorage:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      navigate('/auth?mode=login&redirect=/my-properties');
    }
  }, [navigate]);

  useEffect(() => {
    if (user && user.userId) {
      fetchProperties();
    }
  }, [user]);

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
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8 md:px-8 lg:px-16 flex items-center justify-center">
          <div className="text-red-600">{error}</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar user={user} />
      <main className="flex-grow container mx-auto px-4 py-6 md:px-8 lg:px-16 pt-20 md:pt-24">
        <div className="bg-purple-600 text-white p-4 rounded-t-lg flex justify-between items-center">
          <span className="font-medium">Group homepage</span>
          <div className="flex gap-2">
            <button
              className="bg-purple-700 text-white px-4 py-2 rounded text-sm hover:bg-purple-800"
              onClick={() => navigate('/add-property')}
            >
              Add new property
            </button>
            <button
              className="bg-purple-700 text-white px-4 py-2 rounded text-sm hover:bg-purple-800"
              onClick={() => navigate('/pricing')}
            >
              Get agency status
            </button>
          </div>
        </div>

        <div className="bg-white rounded-b-lg shadow-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            {properties.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No properties found</p>
            ) : (
              <div className="mb-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 text-left text-sm text-gray-600">
                        <th className="px-4 py-3 font-medium">Name</th>
                        <th className="px-4 py-3 font-medium">Address</th>
                        <th className="px-4 py-3 font-medium">Created</th>
                        <th className="px-4 py-3 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {properties.map((property, index) => (
                        <tr
                          key={property._id}
                          className={`border-t border-gray-200 hover:bg-gray-50 ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-black rounded-full"></div>
                              <span className="text-sm font-medium text-gray-800">
                                {property.title}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {property.address}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {formatDate(property.createdAt)}
                          </td>
                          <td className="px-4 py-3 flex gap-2">
                            <button
                              className="text-blue-600 text-sm hover:underline"
                              onClick={() => handleAction(property._id, 'view')}
                            >
                              View
                            </button>
                            <button
                              className="text-gray-600 text-sm hover:text-red-600 hover:underline"
                              onClick={() => handleAction(property._id, 'delete')}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MyPropertiesPage;