import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';

const emptyBooking = {
  renterId: '',
  checkIn: '',
  checkOut: '',
  totalPrice: 0,
  status: 'confirmed',
  numberOfGuests: 1,
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

const BookingManagementPage = () => {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [renters, setRenters] = useState([]);

  const [editingBooking, setEditingBooking] = useState(null);
  const [formData, setFormData] = useState(emptyBooking);
  const [formErrors, setFormErrors] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState(null);

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
      } else {
        navigate('/');
      }
    } else {
      navigate('/auth');
    }
  }, [navigate]);


  const fetchBookings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user'));
      
      // Use different endpoints based on user role
      const endpoint = userData.userType === 'Admin' 
        ? '/api/admin/bookings'
        : '/api/booking/owner';
        
      const res = await axios.get(`http://localhost:5000${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookings(res.data.currentBookings || []);
      setError(null);
    } catch (err) {
      setError('Failed to load bookings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const token = localStorage.getItem('token');
      const rentersRes = await axios.get('/api/user/renters', { headers: { Authorization: `Bearer ${token}` } });
      setRenters(rentersRes.data);
    } catch (err) {
      console.error('Failed to load dropdown data:', err);
    }
  };
        
  const startEdit = (booking) => {
    setEditingBooking(booking);
    setFormData({
      renterId: booking.renterId._id,
      checkIn: new Date(booking.checkIn).toISOString().split('T')[0],
      checkOut: new Date(booking.checkOut).toISOString().split('T')[0],
      totalPrice: booking.totalPrice,
      status: booking.status,
      numberOfGuests: booking.numberOfGuests,
    });
    setFormErrors([]);
  };

  const cancelEdit = () => {
    setEditingBooking(null);
    setFormData(emptyBooking);
    setFormErrors([]);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const validationErrors = validateBookingForm(formData);

    if (validationErrors.length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    setIsSaving(true);
    const token = localStorage.getItem('token');

    try {
      const response = await axios.put(
        `/api/admin/bookings/${editingBooking._id}`, 
        formData, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setBookings(bookings.map(b => 
        b._id === editingBooking._id ? response.data : b
      ));
      cancelEdit();
    } catch (err) {
      setFormErrors([err.response?.data?.message || err.message || 'Unknown error occurred']);
    } finally {
      setIsSaving(false);
    }
  };

  const validateBookingForm = (data) => {
      const errors = [];  
      
    if (!data.renterId) {
      errors.push('Renter is required.');
    }

    if (!data.checkIn) {
      errors.push('Check-in date is required.');
    }

    if (!data.checkOut) {
      errors.push('Check-out date is required.');
    } else if (new Date(data.checkOut) <= new Date(data.checkIn)) {
      errors.push('Check-out date must be after check-in date.');
    }

    if (!data.totalPrice || data.totalPrice <= 0) {
      errors.push('Total price must be greater than 0.');
    }

    if (!data.numberOfGuests || data.numberOfGuests < 1) {
      errors.push('Number of guests must be at least 1.');
    }

    if (!data.status) {
      errors.push('Status is required.');
    }

    return errors;
  };

  const confirmDelete = (booking) => {
    setBookingToDelete(booking);
    setShowConfirmModal(true);
  };

  const handleDelete = async () => {
    if (!bookingToDelete) return;

    const token = localStorage.getItem('token');
    try {
      await axios.delete(`/api/admin/bookings/${bookingToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchBookings();
    } catch (err) {
      alert('Error deleting booking: ' + (err.response?.data?.message || err.message));
    } finally {
      setShowConfirmModal(false);
      setBookingToDelete(null);
    }
  };


  const getRenterName = (booking) => {
    return booking.renterId?.name || 'Unknown';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    cancelled_by_renter: 'bg-red-100 text-red-800',
    cancelled_by_owner: 'bg-red-100 text-red-800',
    completed: 'bg-blue-100 text-blue-800',
    failed: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar user={user} />
      <main className="flex-grow pt-28 px-6 md:px-12 max-w-7xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-6 text-center">Booking Management</h1>

        {loading ? (
          <p className="text-center">Loading bookings...</p>
        ) : error ? (
          <p className="text-center text-red-600">{error}</p>
        ) : (
          <>
            <div className="overflow-x-auto mb-8">
              <table className="min-w-full bg-white rounded shadow">
                <thead>
                  <tr className="bg-gray-200 text-left">
                    <th className="py-3 px-4">Renter</th>
                    <th className="py-3 px-4">Check-In</th>
                    <th className="py-3 px-4">Check-Out</th>
                    <th className="py-3 px-4">Total Price</th>
                    <th className="py-3 px-4">Guests</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking._id} className="border-t">
                      <td className="py-2 px-4">{getRenterName(booking)}</td>
                      <td className="py-2 px-4">{formatDate(booking.checkIn)}</td>
                      <td className="py-2 px-4">{formatDate(booking.checkOut)}</td>
                      <td className="py-2 px-4">${booking.totalPrice.toFixed(2)}</td>
                      <td className="py-2 px-4">{booking.numberOfGuests}</td>
                      <td className="py-2 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[booking.status]}`}>
                          {booking.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-2 px-4 space-x-2">
                        <button
                          onClick={() => startEdit(booking)}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => confirmDelete(booking)}
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

            {editingBooking && (
              <div className="bg-white p-6 rounded shadow max-w-3xl mx-auto mb-20">
                <h2 className="text-xl font-semibold mb-4">Edit Booking</h2>

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
                  Renter
                  <select
                    name="renterId"
                    value={formData.renterId}
                    onChange={handleInputChange}
                    className="w-full border rounded p-2 mt-1"
                    required
                  >
                    <option value="">Select a renter</option>
                    {renters.map(renter => (
                      <option key={renter._id} value={renter._id}>{renter.name}</option>
                    ))}
                  </select>
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <label className="block">
                    Check-In Date
                    <input
                      type="date"
                      name="checkIn"
                      value={formData.checkIn}
                      onChange={handleInputChange}
                      className="w-full border rounded p-2 mt-1"
                      required
                    />
                  </label>
                  <label className="block">
                    Check-Out Date
                    <input
                      type="date"
                      name="checkOut"
                      value={formData.checkOut}
                      onChange={handleInputChange}
                      className="w-full border rounded p-2 mt-1"
                      required
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <label className="block">
                    Total Price
                    <input
                      type="number"
                      name="totalPrice"
                      value={formData.totalPrice}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full border rounded p-2 mt-1"
                      required
                    />
                  </label>
                  <label className="block">
                    Number of Guests
                    <input
                      type="number"
                      name="numberOfGuests"
                      value={formData.numberOfGuests}
                      onChange={handleInputChange}
                      min="1"
                      className="w-full border rounded p-2 mt-1"
                      required
                    />
                  </label>
                </div>

                <label className="block mb-6">
                  Status
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full border rounded p-2 mt-1"
                    required
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled_by_renter">Cancelled by Renter</option>
                    <option value="cancelled_by_owner">Cancelled by Owner</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                  </select>
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
            message={`Are you sure you want to delete booking?`}
            onConfirm={handleDelete}
            onCancel={() => setShowConfirmModal(false)}
          />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default BookingManagementPage;