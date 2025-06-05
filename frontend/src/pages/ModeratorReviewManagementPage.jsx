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

const ModeratorReviewManagementPage = () => {
  const [user, setUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);
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

  // Fetch all reviews from the API
  const fetchReviews = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/moderator/reviews', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReviews(res.data);
      setError(null);
    } catch {
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  // Confirm deletion of a review
  const confirmDelete = (review) => {
    setReviewToDelete(review);
    setShowConfirmModal(true);
  };

  // Handle review deletion
  const handleDelete = async () => {
    if (!reviewToDelete) return;

    const token = localStorage.getItem('token');
    try {
      await axios.delete(`/api/moderator/reviews/${reviewToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchReviews();
    } catch (err) {
      alert('Error deleting review: ' + (err.response?.data?.message || err.message));
    } finally {
      setShowConfirmModal(false);
      setReviewToDelete(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar user={user} />
      <main className="flex-grow pt-28 px-6 md:px-12 max-w-7xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-6 text-center">Review Management</h1>

        {loading ? (
          <p className="text-center">Loading reviews...</p>
        ) : error ? (
          <p className="text-center text-red-600">{error}</p>
        ) : (
          <div className="overflow-x-auto mb-8">
            <table className="min-w-full bg-white rounded shadow">
              <thead>
                <tr className="bg-gray-200 text-left">
                  <th className="py-3 px-4 w-1/6">User</th>
                  <th className="py-3 px-4 w-1/6">Property</th>
                  <th className="py-3 px-4 w-1/12">Rating</th>
                  <th className="py-3 px-4 w-1/3">Comment</th>
                  <th className="py-3 px-4 w-1/6">Date</th>
                  <th className="py-3 px-4 w-1/6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review) => (
                  <tr key={review._id} className="border-t">
                    <td className="py-2 px-4 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                      {review.userId?.name || 'Unknown'}
                    </td>
                    <td className="py-2 px-4 whitespace-nowrap overflow-hidden text-ellipsis">
                      {review.propertyId?.title || 'Unknown'}
                    </td>
                    <td className="py-2 px-4 whitespace-nowrap">
                      {review.rating || '-'}
                    </td>
                    <td className="py-2 px-4 whitespace-nowrap overflow-hidden text-ellipsis">
                      {review.comment || '-'}
                    </td>
                    <td className="py-2 px-4 whitespace-nowrap">
                      {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-2 px-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => confirmDelete(review)}
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
        )}

        {showConfirmModal && (
          <ConfirmModal
            message={`Are you sure you want to delete the review by "${reviewToDelete?.userId?.name || 'Unknown'}"?`}
            onConfirm={handleDelete}
            onCancel={() => setShowConfirmModal(false)}
          />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ModeratorReviewManagementPage;