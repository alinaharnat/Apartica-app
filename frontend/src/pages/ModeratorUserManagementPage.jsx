import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';

// Modal component for confirming actions
const ConfirmModal = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
        <p className="mb-6 text-center">{message}</p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded border hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const ModeratorUserManagementPage = () => {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ isBlocked: false });
  const [formErrors, setFormErrors] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  // Check authentication and fetch users on mount
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const userData = JSON.parse(stored);
      if (userData.userType.includes('Moderator')) {
        setUser(userData);
        fetchUsers();
      } else {
        navigate('/');
      }
    } else {
      navigate('/auth');
    }
  }, [navigate]);

  // Fetch all users from the API
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/moderator/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
      setError(null);
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Start editing a user
  const startEdit = (user) => {
    setEditingUser(user);
    setFormData({ isBlocked: user.isBlocked || false });
    setFormErrors([]);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingUser(null);
    setFormData({ isBlocked: false });
    setFormErrors([]);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  // Save changes to user
  const handleSave = async () => {
    if (!editingUser) return;
    setIsSaving(true);
    const token = localStorage.getItem('token');

    try {
      await axios.put(`/api/moderator/users/${editingUser._id}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchUsers();
      cancelEdit();
    } catch (err) {
      setFormErrors([err.response?.data?.message || err.message || 'Unknown error']);
    } finally {
      setIsSaving(false);
    }
  };

  const isAdminOrModerator = (user) => {
    return user.userType.includes('Administrator') || user.userType.includes('Moderator');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar user={user} />
      <main className="flex-grow pt-28 px-6 md:px-12 max-w-7xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-6 text-center">User Management</h1>

        {loading ? (
          <p className="text-center">Loading users...</p>
        ) : error ? (
          <p className="text-center text-red-600">{error}</p>
        ) : (
          <>
            <div className="overflow-x-auto mb-8">
              <table className="min-w-full bg-white rounded shadow">
                <thead>
                  <tr className="bg-gray-200 text-left">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Roles</th>
                    <th className="py-3 px-4">Blocked</th>
                    <th className="py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                    key={user._id}
                    className={`border-t ${isAdminOrModerator(user) ? 'bg-purple-100' : ''}`}
                  >
                      <td className="py-2 px-4 font-medium">{user.name}</td>
                      <td className="py-2 px-4">{user.email}</td>
                      <td className="py-2 px-4">{user.userType.join(', ')}</td>
                      <td className="py-2 px-4">
                        {user.isBlocked ? (
                          <span className="text-red-600 font-semibold">Blocked</span>
                        ) : (
                          <span className="text-green-600 font-semibold">Active</span>
                        )}
                      </td>
                      <td className="py-2 px-4 space-x-2">
                        <button
                          onClick={() => startEdit(user)}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {editingUser && (
              <div className="bg-white p-6 rounded shadow max-w-xl mx-auto mb-20">
                <h2 className="text-xl font-semibold mb-4">Edit User</h2>

                {formErrors.length > 0 && (
                  <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <p className="font-semibold">Please fix the following errors:</p>
                    <ul className="list-disc list-inside mt-2">
                      {formErrors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <label className="block mb-6">
                  <input
                    type="checkbox"
                    name="isBlocked"
                    checked={formData.isBlocked}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  Blocked
                </label>

                <div className="flex justify-end space-x-4">
                  <button onClick={cancelEdit} className="px-4 py-2 rounded border">
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ModeratorUserManagementPage;