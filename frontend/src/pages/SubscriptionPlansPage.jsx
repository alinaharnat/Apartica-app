// src/pages/SubscriptionPlansPage.jsx
import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const plansData = [
  {
    title: 'Property owner',
    monthlyPrice: 'Free',
    numberOfProperties: 'Up to 2 properties',
    customerSupport: 'Email support',
    listingVisibility: 'Standart visibility',
    colorTop: 'bg-white text-white rounded-t-lg', 
    colorBottom: 'bg-white rounded-b-lg',
    buttonBg: 'bg-purple-500',
    buttonText: 'Your current plan',
    isHighlighted: false,
    frameStyle: { 
      backgroundColor: 'bg-purple-500',
      borderRadius: 'rounded-[14px]',
      padding: 'p-7',
      margin: 'm-3',
    },
    textColor: 'text-white',
  },
  {
    title: 'Agency',
    monthlyPrice: '€19.99',
    numberOfProperties: 'Great',
    customerSupport: 'Priority 24/7 support',
    listingVisibility: 'Priority visibility',
    colorTop: 'bg-white',
    colorBottom: 'bg-white rounded-b-lg',
    buttonBg: 'bg-purple-500 hover:bg-purple-600',
    buttonText: 'Get Agency',
    isHighlighted: true,
    frameStyle: {
      backgroundColor: 'bg-gradient-to-br from-purple-400 10% via-purple-600 70% to-indigo-400',
      borderRadius: 'rounded-[14px]',
      padding: 'p-7',
      margin: 'm-3',
    },
    textColor: 'text-white',
  },
];

const faqData = [
  {
    question: 'What happens if I want to list more than 2 properties on the free plan?',
    answer: 'You’ll need to upgrade to the Agency plan to unlock unlimited listings.',
  },
  {
    question: 'Can I switch between plans?',
    answer: 'Yes, you can upgrade to Agency or downgrade to Property Owner anytime.',
  },
  {
    question: 'What payment methods do you accept for Agency?',
    answer: 'We accept payment via Google Pay, Visa and MasterCard.',
  },
  {
    question: 'Is there a contract for the Agency plan?',
    answer: 'No long-term commitment-pay monthly and cancel anytime.',
  },
  {
    question: 'How do I get started?',
    answer: 'Sign up for the free Property Owner plan or go Agency for premium features!',
  },
];

const SubscriptionPlansPage = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FFF8F2]">
      <Navbar user={user} />

      <main className="flex-grow p-8">
      <section className="mb-12 text-center mt-20">
  <h2 className="text-3xl font-bold text-gray-800 mb-2">Unlock your property potential with Apartica</h2>
  <p className="text-lg font-semibold text-gray-600 mb-8">Whether you’re listing a couple of properties or managing a portfolio, Apartic has a plan for you.</p>
</section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold text-[#9b57c6] mb-6 text-center">Maximize your capabilities</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {plansData.map((plan) => (
              <div
  key={plan.title}
  className={`rounded-[20px] overflow-hidden flex flex-col ${
    plan.title === 'Agency' ? '' : 'shadow-md' 
  }`}
  style={{ outline: plan.title === 'Agency' ? '4px solid #9b57c6' : 'none' }}
>

                <div className={`rounded-t-[20px] overflow-hidden ${plan.colorTop}`}>
                  <div className={`${plan.frameStyle.backgroundColor} ${plan.frameStyle.borderRadius} ${plan.frameStyle.padding} ${plan.frameStyle.margin}`}>
                    <h3 className={`text-xl font-semibold text-center ${plan.textColor}`}>{plan.title}</h3>
                  </div>
                </div>
                <div className={`p-6 ${plan.colorBottom} flex flex-col justify-between`}>
                  <div className="mb-2">
                    <p className="text-gray-700"><span className="font-semibold">Monthly price</span></p>
                    <p className={`text-lg font-bold text-gray-800`}>{plan.monthlyPrice}</p>
                  </div>
                  <hr className="border-t border-gray-300 my-2" />
                  <div className="mb-2">
                    <p className="text-gray-700"><span className="font-semibold">Number of Properties</span></p>
                    <p className={`text-gray-800`}>{plan.numberOfProperties}</p>
                  </div>
                  <hr className="border-t border-gray-300 my-2" />
                  <div className="mb-2">
                    <p className="text-gray-700"><span className="font-semibold">Customer Support</span></p>
                    <p className={`text-gray-800`}>{plan.customerSupport}</p>
                  </div>
                  <hr className="border-t border-gray-300 my-2" />
                  <div className="mb-4">
                    <p className="text-gray-700"><span className="font-semibold">Listing Visibility</span></p>
                    <p className={`text-gray-800`}>{plan.listingVisibility}</p>
                  </div>
                  <button
  className={`w-full text-white py-2 rounded-md ${plan.buttonBg} transition`}
  onClick={async () => {
    if (plan.title !== 'Agency') return;

    if (!user || !user.userId) {
      alert('Please log in to subscribe.');
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/stripe/create-subscription-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert('Error: ' + (errorData.error || 'Unable to create Stripe session'));
        return;
      }

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Failed to get payment session URL');
      }
    } catch (err) {
      console.error('Error creating Stripe session:', err);
      alert('An error occurred while paying. Please try again later.');
    }
  }}
>
  {plan.buttonText}
</button>


                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12 max-w-2xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Benefits of Agency Plan</h2>
          <ul className="list-disc pl-5 text-gray-700 space-y-2">
            <li>Unlimited listings: showcase as many properties as you want, from cozy apartments to luxury villas.</li>
            <li>Priority Visibility: Get your listings seen first by travelers, boosting bookings.</li>
            <li>24/7 Support: Our team is here to help you succeed, anytime you need us.</li>
          </ul>
        </section>

        <section className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">FAQ Section</h2>
          <p className="text-gray-600 mb-6">Got Questions? We've Got Answers</p>
          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <div key={index}>
                <p className="font-semibold text-gray-800">Q: {faq.question}</p>
                <p className="text-gray-700 mb-2">A: {faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default SubscriptionPlansPage;