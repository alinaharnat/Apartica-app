import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';

const emptyProperty = {
  title: '',
  description: '',
  address: '',
  cityId: '',
  propertyType: '',
  isListed: true,
};

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

const PropertyManagementPage = () => {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cities, setCities] = useState([]);
  const [propertyTypes, setPropertyTypes] = useState([]);

  const [editingProperty, setEditingProperty] = useState(null);
  const [formData, setFormData] = useState(emptyProperty);
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
      } else if (userData.userType.includes('Administrator')) {
        setUser(userData);
        fetchUsers();
        fetchProperties();
        fetchDropdownData();
      } else {
        navigate('/');
      }
    } else {
      navigate('/auth');
    }
  }, [navigate]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
      setError(null);
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/admin/properties', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProperties(res.data);
      setError(null);
    } catch (err) {
      setError('Failed to load properties');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [citiesRes, typesRes] = await Promise.all([
        axios.get('/api/cities', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/property-types', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      
      setCities(citiesRes.data);
      setPropertyTypes(typesRes.data);
    } catch (err) {
      console.error('Failed to load dropdown data:', err);
    }
  };

  const startEdit = (property) => {
    setEditingProperty(property);
    setFormData({
      title: property.title,
      description: property.description,
      address: property.address,
      cityId: property.cityId._id,
      propertyType: property.propertyType._id,
      isListed: property.isListed,
    });
    setFormErrors([]);
  };

  const cancelEdit = () => {
    setEditingProperty(null);
    setFormData(emptyProperty);
    setFormErrors([]);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    const validationErrors = validatePropertyForm(formData);

    if (validationErrors.length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    setIsSaving(true);
    const token = localStorage.getItem('token');

    try {
      const response = await axios.put(
        `/api/admin/properties/${editingProperty._id}`, 
        formData, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setProperties(properties.map(p => 
        p._id === editingProperty._id ? response.data : p
      ));
      cancelEdit();
    } catch (err) {
      setFormErrors([err.response?.data?.message || err.message || 'Unknown error occurred']);
    } finally {
      setIsSaving(false);
    }
  };

  const validatePropertyForm = (data) => {
    const errors = [];

    if (!data.title) {
      errors.push('You must enter title.');
    }

    if (!data.description) {
      errors.push('You must enter title description.');
    }

    if (!data.address) {
      errors.push('You must enter title address.');
    }

    if (!data.cityId) {
      errors.push('City is required.');
    }

    if (!data.propertyType) {
      errors.push('Property type is required.');
    }

    return errors;
  };

  const confirmDelete = (property) => {
    setPropertyToDelete(property);
    setShowConfirmModal(true);
  };

  const handleDelete = async () => {
    if (!propertyToDelete) return;

    const token = localStorage.getItem('token');
    try {
      const response = await axios.delete(`/api/properties/${propertyToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert(response.data.message);
      await fetchProperties();
    } catch (err) {
      alert('Error deleting property: ' + (err.response?.data?.message || err.message));
    } finally {
      setShowConfirmModal(false);
      setPropertyToDelete(null);
    }
  };

  const getPropertyTypeName = (property) => {
    return property.propertyType?.name || 'Unknown';
  };

  const getCityName = (property) => {
    return property.cityId?.name || 'Unknown';
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
                    <th className="py-3 px-4 w-1/6">Type</th>
                    <th className="py-3 px-4 w-1/6">Status</th>
                    <th className="py-3 px-4 w-1/5">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map((property) => (
                    <tr key={property._id} className="border-t">
                      <td className="py-2 px-4 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                        {property.title}
                      </td>
                      <td className="py-2 px-4 whitespace-nowrap overflow-hidden text-ellipsis">
                        {property.address}
                      </td>
                      <td className="py-2 px-4 whitespace-nowrap">
                        {getCityName(property)}
                      </td>
                      <td className="py-2 px-4 whitespace-nowrap">
                        {getPropertyTypeName(property)}
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
              <div className="bg-white p-6 rounded shadow max-w-3xl mx-auto mb-20">
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

                <label className="block mb-3">
                  Title
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full border rounded p-2 mt-1"
                    required
                  />
                </label>

                <label className="block mb-3">
                  Description
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full border rounded p-2 mt-1"
                    rows="4"
                    required
                  />
                </label>

                <label className="block mb-3">
                  Address
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full border rounded p-2 mt-1"
                    required
                  />
                </label>

                <label className="block mb-3">
                  City
                  <select
                    name="cityId"
                    value={formData.cityId}
                    onChange={handleInputChange}
                    className="w-full border rounded p-2 mt-1"
                    required
                  >
                    <option value="">Select a city</option>
                    {cities.map(city => (
                      <option key={city._id} value={city._id}>{city.name}</option>
                    ))}
                  </select>
                </label>

                <label className="block mb-3">
                  Property Type
                  <select
                    name="propertyType"
                    value={formData.propertyType}
                    onChange={handleInputChange}
                    className="w-full border rounded p-2 mt-1"
                    required
                  >
                    <option value="">Select a property type</option>
                    {propertyTypes.map(type => (
                      <option key={type._id} value={type._id}>{type.name}</option>
                    ))}
                  </select>
                </label>

                <label className="block mb-6">
                  <input
                    type="checkbox"
                    name="isListed"
                    checked={formData.isListed}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  Listed (visible to users)
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

        {showConfirmModal && (
          <ConfirmModal
            message={`Are you sure you want to delete property "${propertyToDelete?.title}"?`}
            onConfirm={handleDelete}
            onCancel={() => setShowConfirmModal(false)}
          />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default PropertyManagementPage;  