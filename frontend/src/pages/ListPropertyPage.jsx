// src/pages/ListPropertyPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import residentialImage from '../assets/residential 1.png';

// Heroicons imports
import { CheckCircleIcon as CheckCircleIconOutline } from '@heroicons/react/24/outline';
import { CogIcon as CogIconOutline } from '@heroicons/react/24/outline';
import { CreditCardIcon as CreditCardIconOutline } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/20/solid';

// ListPropertyPage: Landing page for property owners to list their apartments
const ListPropertyPage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    // Load user from localStorage on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (error) {
                console.error("Failed to parse user from localStorage:", error);
                localStorage.removeItem('user');
            }
        }
    }, []);

    // Handle "Get started" button click
    const handleGetStarted = (e) => {
        e.preventDefault();
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            navigate('/add-property');
        } else {
            const queryParams = new URLSearchParams(location.search);
            const currentRedirect = queryParams.get('redirect');
            const redirectPath = currentRedirect || '/add-property';
            navigate(`/auth?mode=login&redirect=${encodeURIComponent(redirectPath)}`);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#FDF6F2] text-gray-800">
            <Navbar user={user} />

            <main className="flex-grow">
                {/* Hero section: Main call to action */}
                <section className="bg-[#A485C0] text-white pt-28 pb-16 md:pt-36 md:pb-24 px-6 md:px-12 lg:px-24">
                    <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-8 md:gap-16">
                        <div className="md:w-1/2 lg:w-3/5 text-center md:text-left">
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-5 leading-tight">
                                List your apartment on Apartica
                            </h1>
                            <p className="text-lg sm:text-xl lg:text-2xl opacity-90">
                                Start increasing your income right now by listing your property on Apartica
                            </p>
                        </div>
                        <div className="md:w-1/2 lg:w-2/5 flex justify-center md:justify-end mt-8 md:mt-0">
                            <img
                                src={residentialImage}
                                alt="Apartment Buildings Illustration"
                                className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg"
                            />
                        </div>
                    </div>
                </section>

                {/* Advantages section: Key benefits for property owners */}
                <section className="py-12 md:py-20 bg-white px-6 md:px-12 lg:px-24">
                    <div className="container mx-auto">
                        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 md:mb-16 text-gray-700">
                            Our advantages
                        </h2>
                        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
                            <div className="flex flex-col items-center text-center p-4 rounded-lg">
                                <CheckCircleIconOutline className="w-12 h-12 text-purple-600 mb-4" />
                                <h3 className="text-xl font-semibold mb-2 text-gray-700">Get bookings from real people!</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    All renters must register, verifying their email and credit card in order to book a property.
                                </p>
                            </div>
                            <div className="flex flex-col items-center text-center p-4 rounded-lg">
                                <CogIconOutline className="w-12 h-12 text-purple-600 mb-4" />
                                <h3 className="text-xl font-semibold mb-2 text-gray-700">Set your own rules!</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    Adjust your property rules that guests will be obliged to follow.
                                </p>
                            </div>
                            <div className="flex flex-col items-center text-center p-4 rounded-lg">
                                <CreditCardIconOutline className="w-12 h-12 text-purple-600 mb-4" />
                                <h3 className="text-xl font-semibold mb-2 text-gray-700">Be sure you get paid!</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    Receive guaranteed payouts and be secured by our fraud protection.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Registration section: Encourage sign up */}
                <section className="bg-[#E9E2F3] py-16 md:py-24 px-6 md:px-12 lg:px-24">
                    <div className="container mx-auto flex flex-col lg:flex-row items-center justify-around gap-10 md:gap-16">
                        <div className="lg:w-1/2 text-center lg:text-left">
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 mb-6 leading-tight">
                                Register and start getting bookings today!
                            </h2>
                        </div>

                        <div className="lg:w-2/5 w-full max-w-md bg-white p-8 rounded-xl shadow-2xl">
                            <h3 className="text-2xl font-bold mb-5 text-gray-700 text-center">Sign up for free</h3>
                            <ul className="space-y-3 mb-6 text-sm text-gray-600">
                                <li className="flex items-start">
                                    <CheckCircleIconSolid className="w-5 h-5 text-green-500 mr-2 mt-0.5 shrink-0" />
                                    <span>90% of hosts get at least 20 bookings per year</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircleIconSolid className="w-5 h-5 text-green-500 mr-2 mt-0.5 shrink-0" />
                                    <span>Your property will be shown in the list of properties in your area</span>
                                </li>
                            </ul>
                            <button
                                onClick={handleGetStarted}
                                className="w-full bg-[#8252A1] text-white font-semibold py-3.5 px-6 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 transition duration-300 text-lg shadow-md"
                            >
                                Get started now
                            </button>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default ListPropertyPage;
