import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const SuccessRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const sessionId = queryParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      navigate('/');
      return;
    }

    fetch(`/api/stripe/checkout-session?session_id=${sessionId}`)
      .then(res => res.json())
      .then(data => {

        const paymentStatus = data.payment_status === 'paid' ? 'success' : 'cancel';
        const paymentType = data.payment_type || 'booking';

        navigate(`/payment-status?status=${paymentStatus}&type=${paymentType}`);
      })
      .catch(() => {

        navigate('/payment-status?status=cancel&type=booking');
      });
  }, [sessionId, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Checking payment status...</p>
    </div>
  );
};

export default SuccessRedirect;
