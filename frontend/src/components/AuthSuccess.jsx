// src/components/AuthSuccess.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const userData = query.get('userData');

    if (userData) {
      try {
        const parsed = JSON.parse(decodeURIComponent(userData));
        
        // Сохраняем токен и данные пользователя
        localStorage.setItem('token', parsed.token);
        localStorage.setItem('user', JSON.stringify({
          _id: parsed._id,
          userId: parsed.userId,
          name: parsed.name,
          displayName: parsed.displayName,
          email: parsed.email,
          userType: parsed.userType,
          isEmailVerified: parsed.isEmailVerified,
          profilePicture: parsed.profilePicture,
        }));

        // Проверка роли и перенаправление
        if (parsed.userType?.includes('Administrator')) {
          navigate('/admin');
        } else if (parsed.userType?.includes('Moderator')) {
          navigate('/moderator');
        } else {
          navigate('/');
        }

      } catch (err) {
        console.error("AUTH ERROR:", err);
        navigate('/auth?mode=login&error=google_parse_failed');
      }
    } else {
      navigate('/');
    }
  }, [navigate]);

  return <div className="p-8 text-center">Loading... Google authentication</div>;
};

export default AuthSuccess;
