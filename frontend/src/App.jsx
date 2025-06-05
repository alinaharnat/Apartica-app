import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { LoadScript } from '@react-google-maps/api';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import ListPropertyPage from './pages/ListPropertyPage';
import AddPropertyPage from './pages/AddPropertyPage';
import RulesPage from './pages/RulesPage';
import AuthSuccess from './components/AuthSuccess';
import ProfilePage from './pages/ProfilePage';
import BookingsPage from './pages/BookingsPage';
import AdminHomePage from './pages/AdminHomePage';
import UserManagementPage from './pages/UserManagementPage';
import PropertyPage from './pages/PropertyPage';
import BookingPage from './pages/BookingPage';
import PaymentStatusPage from './pages/PaymentStatusPage';
import PropertyManagementPage from './pages/PropertyManagementPage';
import BookingManagementPage from './pages/BookingManagementPage';
import SearchResults from './pages/SearchResults';
import SubscriptionPlansPage from './pages/SubscriptionPlansPage';
import MyPropertiesPage from './pages/MyPropertiesPage';
// import PaymentSuccess from './pages/PaymentSuccess';

const App = () => {
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGoogleMapsKey = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/config/google-maps-key');
        if (!response.ok) {
          throw new Error('Failed to fetch Google Maps API key');
        }
        const data = await response.json();
        setGoogleMapsApiKey(data.key);
      } catch (err) {
        console.error('Error fetching Google Maps API key:', err);
        setError('Failed to load Google Maps API key. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchGoogleMapsKey();
  }, []);

  if (loading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-500">{error}</div>;
  }

  if (!googleMapsApiKey) {
    return <div className="text-center p-4 text-red-500">Google Maps API key not found.</div>;
  }

  return (
    <LoadScript
      googleMapsApiKey={googleMapsApiKey}
      libraries={["places"]}
      language="en" // Примусово англійська
      region="us" // Упередження для англомовного регіону
    >
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/list-your-property" element={<ListPropertyPage />} />
        <Route path="/add-property" element={<AddPropertyPage />} />
        <Route path="/rules" element={<RulesPage />} />
        <Route path="/auth-success" element={<AuthSuccess />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/admin" element={<AdminHomePage />} />
        <Route path="/admin/users" element={<UserManagementPage />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/properties/:id" element={<PropertyPage />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/payment-status" element={<PaymentStatusPage />} />
        <Route path="/admin/properties" element={<PropertyManagementPage />} />
        <Route path="/admin/bookings" element={<BookingManagementPage />} />
        <Route path="/manage-bookings" element={<BookingManagementPage />} />
        <Route path="/my-properties" element={<MyPropertiesPage />} />
        <Route path="/subscription-plans" element={<SubscriptionPlansPage />} />
        <Route path="/success" element={<SuccessRedirect />} />
      </Routes>
    </LoadScript>
  );
};

export default App;