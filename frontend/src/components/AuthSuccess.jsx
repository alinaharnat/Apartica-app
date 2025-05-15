import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const token = query.get('token');

    console.log("TOKEN:", token);

    if (token) {
      localStorage.setItem('token', token);

      fetch('http://localhost:5000/api/user/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(user => {
          localStorage.setItem('user', JSON.stringify(user));
          navigate('/');
        })
        .catch(err => {
          console.error(err);
          console.error("AUTH ERROR:", err);
          navigate('/login?error=auth_failed');
        });
    } else {
      navigate('/');
    }
  }, []);

  return <div className="p-8 text-center">Завантаження... Авторизація через Google</div>;
};

export default AuthSuccess;