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

const ModeratorPropertyManagementPage = () => {
  const [user, setUser] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingProperty, setEditingProperty] = useState(null);
  const [formData, setFormData] = useState({ isListed: false });
  const [formErrors, setFormErrors] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState(null);
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

  // Fetch all properties from the API
  const fetchProperties = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/moderator/properties', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProperties(res.data);
      setError(null);
    } catch {
      setError('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  // Start editing a property
  const startEdit = (property) => {
    setEditingProperty(property);
    setFormData({ isListed: property.isListed || false });
    setFormErrors([]);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingProperty(null);
    setFormData({ isListed: false });
    setFormErrors([]);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  // Save changes to property
  const handleSave = async () => {
    if (!editingProperty) return;
    setIsSaving(true);
    const token = localStorage.getItem('token');

    try {
      await axios.put(`/api/moderator/properties/${editingProperty._id}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchProperties();
      cancelEdit();
    } catch (err) {
      setFormErrors([err.response?.data?.message || err.message || 'Unknown error']);
    } finally {
      setIsSaving(false);
    }
  };

  // Confirm deletion of a property
  const confirmDelete = (property) => {
    setPropertyToDelete(property);
    setShowConfirmModal(true);
  };

  // Handle property deletion
  const handleDelete = async () => {
    if (!propertyToDelete) return;

    const token = localStorage.getItem('token');
    try {
      await axios.delete(`/api/moderator/properties/${propertyToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchProperties();
    } catch (err) {
      alert('Error deleting property: ' + (err.response?.data?.message || err.message));
    } finally {
      setShowConfirmModal(false);
      setPropertyToDelete(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar user={user} />
      <main className="flex-grow pt-28 px-6 md:px-12 max-w-7xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-6 text-center">Property Management</h1>

        {loading ? (
          <p className="text-center">Loading properties...</p>
        ) : error ? (
          <p className="text-center text-red-600">{error}</p>
        ) : (
          <>
            <div className="overflow-x-auto mb-8">
              <table className="min-w-full bg-white rounded shadow">
                <thead>
                  <tr className="bg-gray-200 text-left">
                    <th className="py-3 px-4 w-1/5">Title</th>
                    <th className="py-3 px-4 w-2/5">Address</th>
                    <th className="py-3 px-4 w-1/6">City</th>
                    <th className="py-3 px-4 w-1/6">Owner</th>
                    <th className="py-3 px-4 w-1/6">Status</th>
                    <th className="py-3 px-4 w-1/6">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map((property) => (
                    <tr key={property._id} className="border-t">
                      <td className="py-2 px-4 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                        {property.title}
                      </td>
                      <td className="py-2 px-4 whitespace-nowrap overflow-hidden text-ellipsis">
                        {property.address || '-'}
                      </td>
                      <td className="py-2 px-4 whitespace-nowrap">
                        {property.cityId?.name || '-'}
                      </td>
                      <td className="py-2 px-4 whitespace-nowrap">
                        {property.ownerId?.name || '-'}
                      </td>
                      <td className="py-2 px-4 whitespace-nowrap">
                        {property.isListed ? (
                          <span className="text-green-600 font-semibold">Listed</span>
                        ) : (
                          <span className="text-red-600 font-semibold">Unlisted</span>
                        )}
                      </td>
                      <td className="py-2 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => startEdit(property)}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => confirmDelete(property)}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {editingProperty && (
              <div className="bg-white p-6 rounded shadow max-w-xl mx-auto mb-20">
                <h2 className="text-xl font-semibold mb-4">Edit Property</h2>

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
                    name="isListed"
                    checked={formData.isListed}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  Listed
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

            {showConfirmModal && (
              <ConfirmModal
                message={`Are you sure you want to delete the property "${propertyToDelete?.title}"?`}
                onConfirm={handleDelete}
                onCancel={() => setShowConfirmModal(false)}
              />
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ModeratorPropertyManagementPage;