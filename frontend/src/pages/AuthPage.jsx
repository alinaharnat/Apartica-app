// src/pages/AuthPage.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import googleIcon from '../assets/googleIcon.jpg'; // Припустимо, у вас є іконка Google
// Якщо немає, можна використати: import facebook from '../assets/facebook.png'; як у вас було

const AuthPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);

  const [user, setUser] = useState(null);
  // Визначаємо початковий режим на основі URL або 'login' за замовчуванням
  const initialView = queryParams.get('mode') === 'register' ? 'register' : 'login';
  const [view, setView] = useState(initialView);

  const [emailForVerification, setEmailForVerification] = useState(''); // Для відображення на сторінці верифікації
  const [verificationCode, setVerificationCode] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: ''
  });
  const [loginEmail, setLoginEmail] = useState(''); // Окремий стан для email входу

  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: string }
  const [loading, setLoading] = useState(false);

  // Ефект для синхронізації 'view' з URL параметром 'mode'
  useEffect(() => {
    const currentMode = queryParams.get('mode');
    if (currentMode && currentMode !== view) {
      setView(currentMode);
    }
    // Очищення повідомлення при зміні режиму
    setMessage(null);
  }, [location.search]);


  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      // Якщо користувач вже залогінений, можливо, перенаправити його на головну
      // navigate('/'); // Розкоментуйте, якщо потрібно
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (view === 'login') {
      setLoginEmail(value);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    setMessage(null); // Очистити повідомлення при зміні інпуту
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();

      if (!response.ok) {
        // Спробуємо отримати більш детальне повідомлення про помилку від бекенду
        const errorText = data.message || (data.errors && data.errors.map(err => err.msg).join(', ')) || 'Помилка реєстрації';
        throw new Error(errorText);
      }
      setEmailForVerification(formData.email); // Зберігаємо email для відображення
      setMessage({ type: 'success', text: data.message || 'Код підтвердження надіслано! Перевірте пошту.' });
      setView('verify'); // Переключаємо на сторінку верифікації
      navigate('/auth?mode=verify'); // Оновлюємо URL
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch('http://localhost:5000/api/auth/email-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail }) // Використовуємо loginEmail
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Помилка запиту коду для входу');
      }
      setEmailForVerification(loginEmail); // Зберігаємо email для відображення
      setMessage({ type: 'success', text: data.message || 'Код для входу надіслано!' });
      setView('verify');
      navigate('/auth?mode=verify');
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch('http://localhost:5000/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailForVerification, token: verificationCode })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Помилка підтвердження коду');
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data)); // Зберігаємо всю інформацію про користувача
      setUser(data);
      setMessage({ type: 'success', text: data.message || 'Вхід успішний!' });
      // Затримка перед перенаправленням, щоб користувач побачив повідомлення
      setTimeout(() => {
        navigate('/'); // Перенаправлення на головну сторінку
      }, 1500);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const switchView = (targetView) => {
    setView(targetView);
    setFormData({ name: '', email: '', phoneNumber: '' }); // Скидання форми реєстрації
    setLoginEmail(''); // Скидання email для логіну
    setVerificationCode(''); // Скидання коду верифікації
    setMessage(null); // Очищення повідомлень
    navigate(`/auth?mode=${targetView}`); // Оновлюємо URL при зміні вкладки
  };

  if (user) {
    // Якщо користувач вже увійшов, можна показувати інформацію про нього або перенаправляти
    // Для прикладу, покажемо повідомлення і кнопку виходу
    return (
      <div className="min-h-screen flex flex-col bg-[#FDF6F2] text-gray-800">
        <Navbar user={user} />
        <main className="flex-grow flex items-center justify-center px-4 pt-32 pb-12">
          <div className="max-w-md w-full bg-white shadow-xl rounded-lg px-8 py-10 text-center">
            <h2 className="text-2xl font-semibold mb-4">Ви увійшли як {user.name}</h2>
            {message && (
              <div className={`p-3 mb-4 rounded text-sm ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {message.text}
              </div>
            )}
            <button
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setUser(null);
                navigate('/auth?mode=login');
              }}
              className="w-full bg-purple-600 text-white py-3 rounded hover:bg-purple-700 text-lg mt-4"
            >
              Вийти
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FDF6F2] text-gray-800">
      <Navbar user={user} hideAuthLinks /> {/* Ховаємо стандартні лінки Register/Sign In */}

      <main className="flex-grow flex items-center justify-center px-4 pt-24 sm:pt-28 md:pt-32 pb-12">
        <div className="max-w-md w-full bg-white shadow-xl rounded-lg px-6 sm:px-8 py-8 sm:py-10">
          <h2 className="text-xl sm:text-2xl font-semibold mb-1 text-center">
            {view === 'register' ? 'Create an account' : view === 'verify' ? 'Verify your email' : 'Log in'}
          </h2>
          <p className="mb-5 text-xs sm:text-sm text-gray-600 text-center">
            {view === 'register' ? 'Join Apartica to find your perfect stay.' : view === 'verify' ? `Enter the code sent to ${emailForVerification}` : 'Access your Apartica account.'}
          </p>

          {message && (
            <div className={`p-3 mb-4 rounded text-xs sm:text-sm ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {message.text}
            </div>
          )}

          {view === 'login' && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <input
                type="email"
                name="email" // Додано для handleChange
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="Email"
                className="w-full border border-gray-300 p-2.5 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
                required
              />
              <button
                type="submit"
                className="w-full bg-purple-600 text-white py-2.5 sm:py-3 rounded hover:bg-purple-700 text-sm sm:text-lg transition-colors duration-200"
                disabled={loading}
              >
                {loading ? 'Sending code...' : 'Continue with email'}
              </button>
            </form>
          )}

          {view === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Full Name"
                className="w-full border border-gray-300 p-2.5 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
                required
              />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                className="w-full border border-gray-300 p-2.5 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
                required
              />
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="Phone Number (e.g., 0991234567)"
                className="w-full border border-gray-300 p-2.5 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
                // pattern="[0-9]{10}" // Проста валідація на 10 цифр, можна покращити
                title="Phone number should be 10 digits"
              />
              <button
                type="submit"
                className="w-full bg-purple-600 text-white py-2.5 sm:py-3 rounded hover:bg-purple-700 text-sm sm:text-lg transition-colors duration-200"
                disabled={loading}
              >
                {loading ? 'Registering...' : 'Create account'}
              </button>
            </form>
          )}

          {view === 'verify' && (
            <form onSubmit={handleVerify} className="space-y-4">
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Verification Code"
                className="w-full text-center text-lg sm:text-xl tracking-[0.2em] border border-gray-300 p-2.5 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                maxLength={6}
                required
              />
              <button
                type="submit"
                className="w-full bg-purple-600 text-white py-2.5 sm:py-3 rounded hover:bg-purple-700 text-sm sm:text-lg transition-colors duration-200"
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Verify & Log in'}
              </button>
               <button
                  type="button"
                  onClick={() => switchView('login')} // Дозволяє повернутися до входу
                  className="w-full text-purple-600 hover:underline text-xs sm:text-sm mt-2"
                >
                  Back to login
                </button>
            </form>
          )}

          {view !== 'verify' && (
            <>
              <div className="mt-5 text-center text-xs sm:text-sm text-gray-500">or choose one of the options</div>
              <div className="mt-3 flex justify-center gap-4 sm:gap-6">
                <button
                  onClick={() => window.location.href = 'http://localhost:5000/api/auth/google'}
                  className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center border border-gray-300 rounded-full shadow-md hover:shadow-lg transition-shadow duration-200"
                  title="Sign in with Google"
                >
                  <img src={googleIcon} alt="Google" className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                {/* Можна додати інші кнопки, наприклад Facebook, якщо є відповідний бекенд */}
              </div>

              <div className="mt-5 text-center text-xs sm:text-sm">
                {view === 'login' ? (
                  <span>
                    Don't have an account?{' '}
                    <a onClick={() => switchView('register')} className="text-purple-600 hover:underline cursor-pointer font-medium">
                      Register
                    </a>
                  </span>
                ) : (
                  <span>
                    Already have an account?{' '}
                    <a onClick={() => switchView('login')} className="text-purple-600 hover:underline cursor-pointer font-medium">
                      Log in
                    </a>
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AuthPage;