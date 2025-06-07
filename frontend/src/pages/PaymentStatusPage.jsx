// import React, { useEffect } from 'react';
// import { useLocation, useNavigate } from 'react-router-dom';
// import Navbar from '../components/Navbar';
// import Footer from '../components/Footer';
// import { useAuth } from '../hooks/useAuth';
//
// const PaymentStatusPage = () => {
//   const { user } = useAuth();
//   const navigate = useNavigate();
//   const location = useLocation();
//   const queryParams = new URLSearchParams(location.search);
//   const status = queryParams.get('status');
//   const type = queryParams.get('type') || 'booking';
//
//   useEffect(() => {
//     if (status === 'success' && type === 'booking') {
//       localStorage.removeItem('bookingState');
//     }
//   }, [status, type]);
//
//   const isSuccess = status === 'success';
//
//   return (
//     <div className="min-h-screen flex flex-col justify-between bg-[#FFF8F2]">
//       <Navbar user={user} />
//
//       <main className="max-w-4xl mx-auto px-4 py-8 pt-24 text-center flex-grow">
//         <h1 className="text-3xl font-bold mb-4">
//           {isSuccess
//             ? type === 'subscription'
//               ? 'Підписка успішна!'
//               : 'Оплата успішна!'
//             : 'Оплата скасована'}
//         </h1>
//         <p className="text-lg text-gray-600 mb-8">
//           {isSuccess
//             ? type === 'subscription'
//               ? 'Ви тепер учасник плану Rental Agency. Насолоджуйтесь необмеженими оголошеннями та пріоритетною підтримкою!'
//               : 'Ваш платіж успішно оброблено. Дякуємо, що обрали Apartica!'
//             : 'Ваш платіж було скасовано. Ви можете спробувати ще раз або повернутися на головну сторінку.'}
//         </p>
//         <div className="flex justify-center gap-4">
//           <button
//             onClick={() => navigate('/')}
//             className="py-3 px-6 rounded-lg font-semibold transition text-white bg-[#8252A1] hover:bg-[#6f4587]"
//           >
//             Повернутися на головну
//           </button>
//           <button
//             onClick={() =>
//               navigate(
//                 isSuccess
//                   ? type === 'subscription'
//                     ? '/my-properties'
//                     : '/bookings'
//                   : '/booking'
//               )
//             }
//             className="py-3 px-6 rounded-lg font-semibold transition text-gray-800 bg-gray-200 hover:bg-gray-300"
//           >
//             {isSuccess
//               ? type === 'subscription'
//                 ? 'Керувати об’єктами'
//                 : 'Переглянути бронювання'
//               : 'Повернутися до бронювання'}
//           </button>
//         </div>
//       </main>
//
//       <Footer />
//     </div>
//   );
// };
//
// export default PaymentStatusPage;

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const PaymentStatusPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const status = queryParams.get('status');

  // Додаємо стан для користувача
  const [user, setUser] = useState(null);

  // Витягуємо користувача з localStorage
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  // Очищаємо localStorage після успішного платежу
  useEffect(() => {
    if (status === 'success') {
      localStorage.removeItem('bookingState');
    }
  }, [status]);

  const isSuccess = status === 'success';

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FFF8F2]">
      <Navbar user={user} />

      <main className="max-w-4xl mx-auto px-4 py-8 pt-24 text-center flex-grow">
        <h1 className="text-3xl font-bold mb-4">
          {isSuccess ? 'Payment Successful!' : 'Payment Cancelled'}
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          {isSuccess
            ? 'Your payment has been successfully processed. Thank you for choosing Apartica!'
            : 'Your payment was cancelled. You can try again or return to the homepage.'}
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="py-3 px-6 rounded-lg font-semibold transition text-white bg-[#8252A1] hover:bg-[#6f4587]"
          >
            Return to Homepage
          </button>
          <button
            onClick={() => navigate(isSuccess ? '/bookings' : '/booking')}
            className="py-3 px-6 rounded-lg font-semibold transition text-gray-800 bg-gray-200 hover:bg-gray-300"
          >
            {isSuccess ? 'View Your Bookings' : 'Return to Booking'}
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PaymentStatusPage;