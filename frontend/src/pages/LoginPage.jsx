// import React, { useState, useEffect } from 'react';
// import Navbar from "../components/Navbar.jsx";
// import Footer from "../components/Footer.jsx";
// import { Link } from "react-router-dom";
//
// const LoginPage = () => {
//   const [user, setUser] = useState(null);
//   const [view, setView] = useState('login');
//   const [email, setEmail] = useState('');
//   const [verificationCode, setVerificationCode] = useState('');
//   const [formData, setFormData] = useState({
//     name: '',
//     email: '',
//     phoneNumber: ''
//   });
//   const [message, setMessage] = useState(null);
//   const [loading, setLoading] = useState(false);
//
//   useEffect(() => {
//     const token = localStorage.getItem('token');
//     const savedUser = localStorage.getItem('user');
//     if (token && savedUser) {
//       setUser(JSON.parse(savedUser));
//     }
//   }, []);
//
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };
//
//   const handleRegister = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setMessage(null);
//     try {
//       const response = await fetch('http://localhost:5000/api/auth/register', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(formData)
//       });
//       const data = await response.json();
//       if (!response.ok) throw new Error(data.message || 'Помилка реєстрації');
//       setEmail(formData.email);
//       setMessage({ type: 'success', text: 'Код підтвердження надіслано! Перевірте пошту.' });
//       setView('verify');
//     } catch (error) {
//       setMessage({ type: 'error', text: error.message });
//     } finally {
//       setLoading(false);
//     }
//   };
//
//   const handleEmailLogin = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setMessage(null);
//     try {
//       const response = await fetch('http://localhost:5000/api/auth/email-login', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email })
//       });
//       const data = await response.json();
//       if (!response.ok) throw new Error(data.message || 'Помилка входу');
//       setMessage({ type: 'success', text: 'Код підтвердження надіслано!' });
//       setView('verify');
//     } catch (error) {
//       setMessage({ type: 'error', text: error.message });
//     } finally {
//       setLoading(false);
//     }
//   };
//
//   const handleVerify = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setMessage(null);
//     try {
//       const response = await fetch('http://localhost:5000/api/auth/verify-email', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email, token: verificationCode })
//       });
//       const data = await response.json();
//       if (!response.ok) throw new Error(data.message || 'Помилка підтвердження');
//       localStorage.setItem('token', data.token);
//       localStorage.setItem('user', JSON.stringify(data));
//       setUser(data);
//       setMessage({ type: 'success', text: 'Вхід успішний!' });
//     } catch (error) {
//       setMessage({ type: 'error', text: error.message });
//     } finally {
//       setLoading(false);
//     }
//   };
//
//   const handleLogout = () => {
//     localStorage.removeItem('token');
//     localStorage.removeItem('user');
//     setUser(null);
//   };
//
//   return (
//     <div className="min-h-screen bg-[#FDF6F2] text-gray-800">
//       <Navbar user={user} />
//       <div className="max-w-xl mx-auto mt-24 bg-white shadow-xl rounded-lg px-8 py-10">
//         <h2 className="text-2xl font-semibold mb-2">Log in or create an account</h2>
//         <p className="mb-6 text-sm">You can log in with your Apartica.com account to use our services.</p>
//
//         {message && (
//           <div className={`p-3 mb-4 rounded text-sm ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
//             {message.text}
//           </div>
//         )}
//
//         {view === 'login' && (
//           <form onSubmit={handleEmailLogin} className="space-y-4">
//             <input
//               type="email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               placeholder="Email"
//               className="w-full border border-[#999] p-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
//               required
//             />
//             <button
//               type="submit"
//               className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700"
//               disabled={loading}
//             >
//               {loading ? 'Loading...' : 'Continue with email'}
//             </button>
//           </form>
//         )}
//
//         {view === 'register' && (
//           <form onSubmit={handleRegister} className="space-y-4">
//             <input
//               type="text"
//               name="name"
//               value={formData.name}
//               onChange={handleChange}
//               placeholder="Name"
//               className="w-full border border-[#999] p-2 rounded"
//               required
//             />
//             <input
//               type="email"
//               name="email"
//               value={formData.email}
//               onChange={handleChange}
//               placeholder="Email"
//               className="w-full border border-[#999] p-2 rounded"
//               required
//             />
//             <input
//               type="tel"
//               name="phoneNumber"
//               value={formData.phoneNumber}
//               onChange={handleChange}
//               placeholder="Phone Number"
//               className="w-full border border-[#999] p-2 rounded"
//               required
//             />
//             <button
//               type="submit"
//               className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700"
//               disabled={loading}
//             >
//               {loading ? 'Registering...' : 'Continue with email'}
//             </button>
//           </form>
//         )}
//
//         {view === 'verify' && (
//           <form onSubmit={handleVerify} className="space-y-4">
//             <p className="text-sm">Код надіслано на {email}</p>
//             <input
//               type="text"
//               value={verificationCode}
//               onChange={(e) => setVerificationCode(e.target.value)}
//               placeholder="Verification Code"
//               className="w-full text-center text-xl border border-[#999] p-2 rounded"
//               maxLength={6}
//               required
//             />
//             <button
//               type="submit"
//               className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700"
//               disabled={loading}
//             >
//               {loading ? 'Verifying...' : 'Verify'}
//             </button>
//           </form>
//         )}
//
//         <div className="mt-6 text-center text-sm text-gray-600">or choose one of the options</div>
//
//         <div className="mt-4 flex justify-center gap-6">
//           <button
//             onClick={() => window.location.href = 'http://localhost:5000/api/auth/google'}
//             className="w-12 h-12 flex items-center justify-center border border-gray-300 rounded shadow-md hover:shadow-lg"
//           >
//             <img src="../assets/instagram.png" alt="Google" className="w-6 h-6" />
//           </button>
//
//           <button
//             disabled
//             className="w-12 h-12 flex items-center justify-center border border-gray-300 rounded shadow-md bg-gray-100 cursor-not-allowed"
//           >
//             <img src="../assets/facebook.png" alt="Facebook" className="w-6 h-6 opacity-50" />
//           </button>
//         </div>
//
//         <div className="mt-6 text-center text-sm">
//           {view === 'login' ? (
//             <span>
//               Don't have an account?{' '}
//               <button onClick={() => setView('register')} className="text-purple-600 hover:underline">
//                 Register
//               </button>
//             </span>
//           ) : (
//             <span>
//               Already have an account?{' '}
//               <button onClick={() => setView('login')} className="text-purple-600 hover:underline">
//                 Log in
//               </button>
//             </span>
//           )}
//         </div>
//       </div>
//       <Footer />
//     </div>
//   );
// };
//
// export default LoginPage;

import facebook from '../assets/facebook.png';
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";

const LoginPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);

  const [user, setUser] = useState(null);
  const [view, setView] = useState(queryParams.get('mode') === 'register' ? 'register' : 'login');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: ''
  });
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
        setMessage({ type: 'error', text: data.message || 'Помилка реєстрації' });
        return;
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
        setMessage({ type: 'error', text: data.message || 'Помилка входу!' });
        return;
      }
      setMessage({ type: 'success', text: 'Код підтвердження надіслано!' });
      setView('verify');
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
        body: JSON.stringify({ email, token: verificationCode })
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage({ type: 'error', text: data.message || 'Помилка підтвердження!' });
        return;
      }
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

  const switchView = (target) => {
    setView(target);
    navigate(`/login?mode=${target}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FDF6F2] text-gray-800">
      <Navbar user={user} hideAuthLinks />

      <main className="flex-grow flex items-center justify-center px-4 pt-32 pb-12">
        <div className="max-w-xl w-full bg-white shadow-xl rounded-lg px-8 py-10">
          <h2 className="text-2xl font-semibold mb-2">Log in or create an account</h2>
          <p className="mb-6 text-sm">You can log in with your Apartica.com account to use our services.</p>

          {message && (
            <div className={`p-3 mb-4 rounded text-sm ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {message.text}
            </div>
          )}

          {view === 'login' && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full border border-[#999] p-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
              <button
                type="submit"
                className="w-full bg-purple-600 text-white py-3 rounded hover:bg-purple-700 text-lg"
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Continue with email'}
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
                placeholder="Name"
                className="w-full border border-[#999] p-2 rounded"
                required
              />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                className="w-full border border-[#999] p-2 rounded"
                required
              />
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="Phone Number"
                className="w-full border border-[#999] p-2 rounded"
                required
              />
              <button
                type="submit"
                className="w-full bg-purple-600 text-white py-3 rounded hover:bg-purple-700 text-lg"
                disabled={loading}
              >
                {loading ? 'Registering...' : 'Continue with email'}
              </button>
            </form>
          )}

          {view === 'verify' && (
            <form onSubmit={handleVerify} className="space-y-4">
              <p className="text-sm">Код надіслано на {email}</p>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Verification Code"
                className="w-full text-center text-xl border border-[#999] p-2 rounded"
                maxLength={6}
                required
              />
              <button
                type="submit"
                className="w-full bg-purple-600 text-white py-3 rounded hover:bg-purple-700 text-lg"
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-gray-600">or choose one of the options</div>

          <div className="mt-4 flex justify-center gap-6">
            <button
              onClick={() => window.location.href = 'http://localhost:5000/api/auth/google'}
              className="w-16 h-16 flex items-center justify-center border border-gray-300 rounded shadow-md hover:shadow-lg"
            >
              <img src={facebook} alt="Google" className="w-8 h-8" />
            </button>

            <button
              disabled
              className="w-16 h-16 flex items-center justify-center border border-gray-300 rounded shadow-md bg-gray-100 cursor-not-allowed"
            >
              <img src={facebook} alt="Facebook" className="w-8 h-8 opacity-50" />
            </button>
          </div>

          <div className="mt-6 text-center text-sm">
            {view === 'login' ? (
              <span>
                Don't have an account?{' '}
                <a onClick={() => switchView('register')} className="text-purple-600 hover:underline cursor-pointer">
                  Register
                </a>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <a onClick={() => switchView('login')} className="text-purple-600 hover:underline cursor-pointer">
                  Log in
                </a>
              </span>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LoginPage;
