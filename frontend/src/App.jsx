import React from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import React, { useState, useEffect } from 'react';
import './App.css';

const App = () => {
    return (
        <div>
         <Navbar/>
          <Footer/>
        </div>
    );
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login'); // 'login', 'register', 'verify'
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: ''
  });
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  // Перевірка збереженого токена
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Обробка зміни полів форми
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Реєстрація користувача
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
        throw new Error(data.message || 'Помилка реєстрації');
      }

      setEmail(formData.email);
      setMessage({ type: 'success', text: 'Код підтвердження надіслано! Перевірте пошту.' });
      setView('verify');
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Вхід через пошту
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('http://localhost:5000/api/auth/email-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Помилка входу');
      }

      setMessage({ type: 'success', text: 'Код підтвердження надіслано! Перевірте пошту.' });
      setView('verify');
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Перевірка коду підтвердження
  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('http://localhost:5000/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token: verificationCode })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Помилка перевірки коду');
      }

      // Зберігаємо дані користувача
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      setUser(data);
      setMessage({ type: 'success', text: 'Вхід успішний!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Вихід з системи
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        {user ? (
          // Інформація про користувача
          <div>
            <h2 className="text-2xl font-bold mb-4 text-center">Ви увійшли як</h2>
            <div className="bg-gray-100 p-4 rounded mb-4">
              <p><strong>Ім'я:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Тип користувача:</strong> {user.userType}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full bg-red-600 text-white p-2 rounded hover:bg-red-700"
            >
              Вийти
            </button>
          </div>
        ) : (
          // Форми автентифікації
          <>
            {message && (
              <div className={`p-3 mb-4 rounded ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {message.text}
              </div>
            )}

            {view === 'login' && (
              <>
                <h2 className="text-2xl font-bold mb-4 text-center">Вхід</h2>
                <form onSubmit={handleEmailLogin}>
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 mb-2"
                    disabled={loading}
                  >
                    {loading ? 'Завантаження...' : 'Отримати код'}
                  </button>
                </form>
                <div className="mt-4 text-center">
                  <p>
                    Немає облікового запису?{' '}
                    <button 
                      onClick={() => setView('register')} 
                      className="text-blue-600 hover:underline"
                    >
                      Зареєструватися
                    </button>
                  </p>
                </div>
                <div className="mt-4">
                  <button 
                    onClick={() => window.location.href = 'http://localhost:5000/api/auth/google'}
                    className="w-full border border-gray-300 p-2 rounded flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48" className="mr-2">
                      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                      <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
                      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
                      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
                    </svg>
                    Увійти через Google
                  </button>
                </div>
              </>
            )}

            {view === 'register' && (
              <>
                <h2 className="text-2xl font-bold mb-4 text-center">Реєстрація</h2>
                <form onSubmit={handleRegister}>
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Ім'я</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Номер телефону</label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
                    disabled={loading}
                  >
                    {loading ? 'Завантаження...' : 'Зареєструватися'}
                  </button>
                </form>
                <div className="mt-4 text-center">
                  <p>
                    Вже є обліковий запис?{' '}
                    <button 
                      onClick={() => setView('login')} 
                      className="text-blue-600 hover:underline"
                    >
                      Увійти
                    </button>
                  </p>
                </div>
              </>
            )}

            {view === 'verify' && (
              <>
                <h2 className="text-2xl font-bold mb-2 text-center">Підтвердження коду</h2>
                <p className="text-center text-gray-600 mb-4">
                  Введіть код, надісланий на {email}
                </p>
                <form onSubmit={handleVerify}>
                  <div className="mb-4">
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="w-full p-2 border rounded text-center text-2xl tracking-widest"
                      placeholder="Введіть код"
                      maxLength={6}
                      required
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 mb-2"
                    disabled={loading}
                  >
                    {loading ? 'Перевірка...' : 'Підтвердити код'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setView('login')}
                    className="w-full text-gray-600 p-2 rounded hover:underline"
                  >
                    Повернутися назад
                  </button>
                </form>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );



}

export default App;