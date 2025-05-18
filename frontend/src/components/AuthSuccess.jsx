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
        localStorage.setItem('token', parsed.token);
        localStorage.setItem('user', JSON.stringify({
          _id: parsed._id,
          userId: parsed.userId,
          name: parsed.name,
          displayName: parsed.displayName,
          email: parsed.email,
          roles: parsed.roles,
          isEmailVerified: parsed.isEmailVerified,
          profilePicture: parsed.profilePicture,
        }));
        navigate('/');
      } catch (err) {
        console.error("AUTH ERROR:", err);
        navigate('/auth?mode=login&error=google_parse_failed');
      }
    } else {
      navigate('/');
    }
  }, []);

  return <div className="p-8 text-center">Завантаження... Авторизація через Google</div>;
};

export default AuthSuccess;