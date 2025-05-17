// src/pages/RulesPage.jsx
import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// ПРАВИЛЬНІ ІМПОРТИ для Heroicons v2.x (outline, 24px)
// Переконайтеся, що @heroicons/react встановлено: npm install @heroicons/react
import { EnvelopeIcon as MailIcon } from '@heroicons/react/24/outline'; // MailIcon перейменовано на EnvelopeIcon
import { PhoneIcon } from '@heroicons/react/24/outline';
import { BuildingOffice2Icon as OfficeBuildingIcon } from '@heroicons/react/24/outline'; // OfficeBuildingIcon -> BuildingOffice2Icon (або BuildingOfficeIcon)
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

const RulesPage = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse user from localStorage on RulesPage:", error);
        localStorage.removeItem('user');
      }
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-700">
      <Navbar user={user} />

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 pt-24 md:pt-28">
        <div className="max-w-4xl mx-auto prose prose-lg prose-purple lg:prose-xl hover:prose-a:text-purple-700 prose-headings:font-semibold prose-headings:text-apartica-purple prose-h1:text-center prose-h1:md:text-left prose-h1:!mb-8 prose-h2:!mt-12 prose-h2:!mb-6 prose-h3:!mt-6 prose-h3:!mb-3">
          <h1>About Apartica</h1>
          <p>
            Welcome to Apartica – your trusted partner in finding the perfect place to stay.
            At Apartica, we believe that where you stay shapes your entire travel experience. That's why we're
            dedicated to offering handpicked, quality accommodations for every type of traveler - whether you're
            on a business trip, a romantic getaway, or a family vacation.
          </p>
          <p>
            Founded with a passion for comfort and convenience, Apartica connects guests with cozy apartments,
            stylish studios, and spacious homes across top destinations. Each listing is carefully verified to ensure it
            meets our high standards of cleanliness, comfort, and hospitality.
          </p>
          <p>
            Our mission is simple: <br />
            To make booking accommodation easy, reliable, and tailored to your needs.
          </p>
          <p className="font-semibold text-gray-800">
            Join thousands of happy travelers who have already booked with confidence through Apartica. Your
            next unforgettable stay is just a few clicks away.
          </p>

          <hr />

          <h2>Rules & Conditions</h2>
          <p>
            By using Apartica, you agree to follow these simple but important rules. They help us ensure a smooth
            and enjoyable experience for both guests and hosts.
          </p>

          <div className="space-y-6">
            <div>
              <h3>1. Booking Policy</h3>
              <ul>
                <li>All bookings must be confirmed through the Apartica platform.</li>
                <li>Full payment (or as stated) is required at the time of booking.</li>
                <li>Guests must provide accurate personal information and a valid ID if requested.</li>
              </ul>
            </div>

            <div>
              <h3>2. Cancellation Policy</h3>
              <ul>
                <li>Cancellation terms may vary depending on the property.</li>
                <li>Refunds are processed according to the host's specific policy.</li>
                <li>Property owners can set their own cancellation and refund policies. If the owner doesn't specify a policy, the system's default cancellation rules apply:
                  <ul className="list-disc">
                    <li>Free cancellation if made more than 14 days before check-in.</li>
                    <li>50% refund if canceled within 7-14 days before check-in.</li>
                    <li>No refund if canceled less than 7 days before check-in.</li>
                  </ul>
                </li>
                <li>When a user submits a cancellation request, the system should calculate the refund amount based on the applicable policy and automatically initiate the refund process.</li>
              </ul>
            </div>
          </div>

          <hr />

          <h2>Contact Us</h2>
          <p>
            We're here to make your experience with Apartica seamless and enjoyable! Whether you're planning a
            trip, managing a booking, or simply exploring options for your next stay, our dedicated team is ready to
            assist you.
          </p>
          <div className="space-y-5 not-prose my-6">
            <div className="flex items-start">
              <MailIcon className="w-6 h-6 text-apartica-purple mr-3 shrink-0 mt-1" /> {/* Використовуємо перейменовану MailIcon (EnvelopeIcon) */}
              <div>
                <h4 className="font-semibold text-gray-800 text-lg">Email Us:</h4>
                <p className="text-gray-700 text-base">Reach out to our support team at <a href="mailto:support@apartica.com" className="text-apartica-purple hover:underline">support@apartica.com</a>. We aim to respond to all emails within 24 hours.</p>
              </div>
            </div>
            <div className="flex items-start">
              <PhoneIcon className="w-6 h-6 text-apartica-purple mr-3 shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-gray-800 text-lg">Call Us:</h4>
                <p className="text-gray-700 text-base">Speak directly with one of our representatives by calling <a href="tel:+380441234567" className="text-apartica-purple hover:underline">+380 44 123 4567</a>. Our phone lines are open Monday to Friday, from 9:00 AM to 6:00 PM (Kyiv time).</p>
              </div>
            </div>
          </div>

          <hr />

          <h2>Visit Our Office</h2>
          <p>
            We'd love to meet you in person! If you're in Kyiv, feel free to stop by our office for a face-to-face consultation.
          </p>
          <div className="flex items-start not-prose my-6">
            <OfficeBuildingIcon className="w-6 h-6 text-apartica-purple mr-3 shrink-0 mt-1" /> {/* Використовуємо перейменовану OfficeBuildingIcon (BuildingOffice2Icon) */}
            <div>
              <h4 className="font-semibold text-gray-800 text-lg">Address:</h4>
              <p className="text-gray-700 text-base">12 Khreshchatyk Street, Kyiv, Ukraine, 01001</p>
              <p className="text-gray-700 text-base">Office Hours: Monday to Friday, 10:00 AM to 5:00 PM</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RulesPage;