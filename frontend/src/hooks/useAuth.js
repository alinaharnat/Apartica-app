import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [notification, setNotification] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    console.log('useAuth - Stored user data:', storedUser); // Debug log
    console.log('useAuth - Stored token:', token); // Debug log

    const fetchUserData = async () => {
      if (token) {
        try {
          const res = await axios.get('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const userData = res.data;
          console.log('useAuth - Fetched user data:', userData); // Debug log
          console.log('useAuth - isBlocked status:', userData.isBlocked); // Debug log

          // Update localStorage with fresh data
          localStorage.setItem('user', JSON.stringify(userData));

          if (userData.isBlocked) {
            console.log('useAuth - User is blocked, logging out...'); // Debug log
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setNotification('Your account has been blocked. Please contact support for assistance.');
            setUser(null);
            navigate('/');
            return;
          }

          setUser(userData);
        } catch (err) {
          console.error('useAuth - Error fetching user data:', err.response?.data || err.message);
          if (err.response?.status === 403) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setNotification(err.response.data.message || 'Your account has been blocked. Please contact support for assistance.');
            setUser(null);
            navigate('/');
          } else if (err.response?.status === 401) {
            // Token invalid, log out
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            navigate('/auth');
          }
        }
      } else if (storedUser) {
        // If no token but user data exists, clear it
        localStorage.removeItem('user');
        setUser(null);
      }
    };

    fetchUserData();

    // Check for URL error parameter (e.g., from Google callback)
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    if (error === 'account_blocked') {
      console.log('useAuth - URL error: account_blocked'); // Debug log
      setNotification('Your account has been blocked. Please contact support for assistance.');
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      setUser(null);
      navigate('/');
    }
  }, [navigate]);

  const dismissNotification = () => {
    setNotification(null);
  };

  return { user, notification, dismissNotification };
};