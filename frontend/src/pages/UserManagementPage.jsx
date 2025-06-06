import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';

// Default user object for form initialization
const emptyUser = {
  name: '',
  email: '',
  phoneNumber: '',
  userType: ['Renter'], // Default to an array with 'Renter'
  isBlocked: false,
  gender: '',
  birthDate: '',
};

// Modal for confirming user deletion
const ConfirmModal = ({ message, onConfirm, onCancel }) => (
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

const UserManagementPage = () => {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState(emptyUser);
  const [formErrors, setFormErrors] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const navigate = useNavigate();

  // Check user authentication and authorization on mount
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      navigate('/auth');
      return;
    }
    const userData = JSON.parse(stored);
    if (userData.isBlocked) {
      navigate('/');
    } else if (userData.userType.includes('Administrator')) {
      setUser(userData);
      fetchUsers();
    } else {
      navigate('/');
    }
  }, [navigate]);

  // Fetch all users from the backend
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

  // Map backend gender (lowercase) to frontend (capitalized)
  const sanitizeGender = (gender) => {
    const genderMap = {
      male: 'Male',
      female: 'Female',
      other: 'Other',
      '': '',
    };
    return genderMap[gender] || '';
  };

  // Format date as "DD MMM YYYY" (e.g., "05 Jun 2025")
  const formatDate = (dateString) =>
    dateString
      ? new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(new Date(dateString))
      : '-';

  // Start editing a user
  const startEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      userType: Array.isArray(user.userType) ? user.userType : [user.userType] || ['Renter'], // Ensure userType is an array
      isBlocked: !!user.isBlocked,
      gender: sanitizeGender(user.gender),
      birthDate: user.dateOfBirth ? user.dateOfBirth.slice(0, 10) : '',
    });
    setFormErrors([]);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingUser(null);
    setFormData(emptyUser);
    setFormErrors([]);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      // Handle userType checkboxes
      if (name === 'userType') {
        setFormData((prev) => {
          const userType = prev.userType || [];
          if (checked) {
            // Add the role if checked
            return { ...prev, userType: [...userType, value] };
          } else {
            // Remove the role if unchecked
            return { ...prev, userType: userType.filter((role) => role !== value) };
          }
        });
      } else {
        // Handle other checkboxes (e.g., isBlocked)
        setFormData((prev) => ({
          ...prev,
          [name]: checked,
        }));
      }
    } else {
      // Handle other inputs
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Save user (create or update)
  const handleSave = async () => {
    const isEdit = !!editingUser;
    const validationErrors = validateUserForm(formData, isEdit);

    if (validationErrors.length > 0) {
      console.log('Validation errors:', validationErrors);
      setFormErrors(validationErrors);
      return;
    }
    setFormErrors([]);

    setIsSaving(true);
    const token = localStorage.getItem('token');

    try {
      const payload = {
        ...formData,
        userType: formData.userType || ['Renter'], // Ensure userType is an array, default to ['Renter']
        gender: formData.gender.toLowerCase(), // Convert to lowercase
        dateOfBirth: formData.birthDate || undefined, // Map to backend field
      };
      console.log('Saving payload:', payload);

      if (isEdit) {
        await axios.put(`/api/admin/users/${editingUser._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`/api/admin/users`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      await fetchUsers();
      cancelEdit();
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Unknown error occurred';
      console.error('Save error:', errorMessage);
      setFormErrors([errorMessage]);
    } finally {
      setIsSaving(false);
    }
  };

  // Validate form data
  const validateUserForm = (data, isEditMode = false) => {
    const errors = [];

    if (!data.name || data.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters long.');
    }

    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Valid email is required.');
    }

    if (data.phoneNumber && !/^\+?[0-9\s\-()]{7,20}$/.test(data.phoneNumber)) {
      errors.push('Invalid phone number.');
    }

    const allowedGenders = ['Male', 'Female', 'Other', ''];
    if (!allowedGenders.includes(data.gender)) {
      errors.push('Invalid gender value.');
    }

    const allowedRoles = ['Renter', 'PropertyOwner', 'Administrator', 'Moderator', 'RentalAgency'];
    if (!Array.isArray(data.userType) || data.userType.length === 0) {
      errors.push('At least one role must be selected.');
    } else {
      data.userType.forEach((role) => {
        if (!allowedRoles.includes(role)) {
          errors.push(`Invalid role value: ${role}`);
        }
      });
    }

    if (data.birthDate) {
      const birth = new Date(data.birthDate);
      const now = new Date();
      if (isNaN(birth.getTime())) {
        errors.push('Invalid birth date.');
      } else if (birth > now) {
        errors.push('Birth date cannot be in the future.');
      } else {
        const age = now.getFullYear() - birth.getFullYear();
        const monthDiff = now.getMonth() - birth.getMonth();
        const dayDiff = now.getDate() - birth.getDate();
        const fullAge =
          monthDiff > 0 || (monthDiff === 0 && dayDiff >= 0) ? age : age - 1;
        if (fullAge < 18) {
          errors.push('User must be at least 18 years old.');
        }
      }
    } else if (!isEditMode) {
      // Allow empty birthDate in create mode
    }

    return errors;
  };

  // Confirm user deletion
  const confirmDelete = (user) => {
    setUserToDelete(user);
    setShowConfirmModal(true);
  };

  // Delete user
  const handleDelete = async () => {
    if (!userToDelete) return;

    const token = localStorage.getItem('token');
    try {
      await axios.delete(`/api/admin/users/${userToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchUsers();
    } catch (err) {
      alert('Error deleting user: ' + (err.response?.data?.message || err.message));
    } finally {
      setShowConfirmModal(false);
      setUserToDelete(null);
    }
  };

  // Check if user is admin or moderator for styling
  const isAdminOrModerator = (user) => {
    const role = Array.isArray(user.userType) ? user.userType : [user.userType];
    return role.includes('Administrator') || role.includes('Moderator');
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
          <div>
            <div className="overflow-x-auto mb-8">
              <table className="min-w-full bg-white rounded shadow">
                <thead>
                <tr className="bg-gray-200 text-left">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Roles</th>
                  <th className="py-3 px-4">Gender</th>
                  <th className="py-3 px-4">Birth Date</th>
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
                    <td className="py-2 px-4">
                      {Array.isArray(user.userType)
                        ? user.userType.join(', ')
                        : user.userType}
                    </td>
                    <td className="py-2 px-4">{sanitizeGender(user.gender) || '-'}</td>
                    <td className="py-2 px-4">{formatDate(user.dateOfBirth)}</td>
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
                      <button
                        onClick={() => confirmDelete(user)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                </tbody>
              </table>
            </div>

            <div className="bg-white p-6 rounded shadow max-w-xl mx-auto mb-20">
              <h2 className="text-xl font-semibold mb-4">
                {editingUser ? 'Edit User' : 'Create New User'}
              </h2>

              {formErrors.length > 0 && (
                <div className="mb-4 bg-red-100 border border-red-600 text-red-700 px-4 py-3 rounded-lg">
                  <p className="font-semibold mb-2">Please fix the following errors:</p>
                  <ul className="list-disc pl-5">
                    {formErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <label className="block mb-3">
                Name
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full border rounded p-2 mt-1"
                  required
                />
              </label>

              <label className="block mb-3">
                Email
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full border rounded p-2 mt-1"
                  required
                  disabled={!!editingUser}
                />
              </label>

              <label className="block mb-3">
                Phone Number
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="w-full border rounded p-2 mt-1"
                />
              </label>

              <fieldset className="mb-4">
                <legend className="font-semibold mb-2">Roles</legend>
                {['Renter', 'PropertyOwner', 'Administrator', 'Moderator', 'RentalAgency'].map(
                  (role) => (
                    <label key={role} className="inline-flex items-center mr-6 mb-2">
                      <input
                        type="checkbox"
                        name="userType"
                        value={role}
                        checked={formData.userType.includes(role)}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      {role}
                    </label>
                  ),
                )}
              </fieldset>

              <fieldset className="mb-4">
                <legend className="font-semibold mb-2">Gender</legend>
                {['Male', 'Female', 'Other', ''].map((g) => (
                  <label
                    key={g || 'none'}
                    className="inline-flex items-center mr-6 mb-2"
                  >
                    <input
                      type="radio"
                      name="gender"
                      value={g}
                      checked={formData.gender === g}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    {g || 'Not specified'}
                  </label>
                ))}
              </fieldset>

              <label className="block mb-6">
                Birth Date
                <input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleInputChange}
                  className="w-full border rounded p-2 mt-1"
                />
              </label>

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
                <button
                  onClick={cancelEdit}
                  className="px-4 py-2 rounded border hover:bg-gray-100"
                >
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
          </div>
        )}

        {showConfirmModal && (
          <ConfirmModal
            message={`Are you sure you want to delete user "${userToDelete?.name}"?`}
            onConfirm={handleDelete}
            onCancel={() => setShowConfirmModal(false)}
          />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default UserManagementPage;