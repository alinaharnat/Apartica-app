import React, { useState, useEffect, useRef } from 'react';
import logo from '../assets/logo.svg';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Navbar = ({ user, hideAuthLinks = false }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userProperties, setUserProperties] = useState([]);
  const dropdownRef = useRef(null);

  // Add property count check - only for PropertyOwners
  const isPropertyOwner = user?.userType?.includes('PropertyOwner');
  const isPrivateOwner = isPropertyOwner && userProperties.length >= 1 && userProperties.length <= 2;
  const isRentalAgency = isPropertyOwner && userProperties.length >= 3;

  const staticLinks = [
    { name: 'Home', path: '/' },
    // Show "List your property" only if user is not an administrator
    ...(user?.userType?.includes('Administrator') ? [] : [
      { name: 'List your property', path: '/list-your-property' }
    ])
  ];

  useEffect(() => {
    const fetchUserProperties = async () => {
      if (user?._id && user?.userType?.includes('PropertyOwner')) {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(`/api/properties/owner/${user._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUserProperties(response.data);
        } catch (error) {
          console.error('Failed to fetch user properties:', error);
        }
      }
    };

    fetchUserProperties();
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const authLinks = hideAuthLinks
    ? []
    : user
      ? [] // Rendered below with dropdown
      : [
          { name: 'Register', path: '/auth?mode=register' },
          { name: 'Sign in', path: '/auth?mode=login' },
        ];

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 w-full flex items-center justify-between px-4 md:px-16 lg:px-24 xl:px-32 transition-all duration-500 z-50 ${
        isScrolled ? 'bg-[#8252A1] shadow-md py-3 md:py-4' : 'bg-[#8252A1] py-4 md:py-6'
      }`}
    >
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2">
        <img src={logo} alt="logo" className={`h-9 ${isScrolled ? 'opacity-80' : ''}`} />
      </Link>

      {/* Desktop Nav */}
      <div className="hidden md:flex items-center gap-4 lg:gap-8">
        {staticLinks.map((link, i) => (
          <Link
            key={i}
            to={link.path}
            className="group flex flex-col gap-0.5 text-white text-sm"
          >
            {link.name}
            <div className="bg-white h-0.5 w-0 group-hover:w-full transition-all duration-300" />
          </Link>
        ))}

        {isPrivateOwner && (
          <Link
            to="/private-owner"
            className="px-4 py-1 rounded-full bg-purple-400 text-white text-sm font-medium transition-colors duration-200 hover:bg-purple-500"
            style={{ marginLeft: '4px', marginRight: '4px' }}
          >
            Private Owner
          </Link>
        )}

        {isRentalAgency && (
          <Link
            to="/rental-agency"
            className="px-4 py-1 rounded-full bg-purple-400 text-white text-sm font-medium transition-colors duration-200 hover:bg-purple-500"
            style={{ marginLeft: '4px', marginRight: '4px' }}
          >
            Rental Agency
          </Link>
        )}

        {!hideAuthLinks && !user &&
          authLinks.map((link, i) => (
            <Link
              key={i}
              to={link.path}
              className="group flex flex-col gap-0.5 text-white text-sm"
            >
              {link.name}
              <div className="bg-white h-0.5 w-0 group-hover:w-full transition-all duration-300" />
            </Link>
          ))}

        {!hideAuthLinks && user && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="text-white text-sm flex items-center gap-1 hover:underline"
            >
              {user.displayName || user.name}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg overflow-hidden z-50">
                <Link
                  to="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <span>👤</span> My account
                </Link>
                {!user?.userType?.includes('Administrator') && (
                  <>
                    <Link
                      to="/bookings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <span>🛏️</span> My bookings
                    </Link>
                    {user?.userType?.includes('PropertyOwner') && (
                      <Link
                        to="/my-properties"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <span>🏠</span> My properties
                      </Link>
                    )}
                  </>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-white bg-purple-300 hover:bg-purple-400"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Menu Button */}
      <div className="flex items-center gap-3 md:hidden">
        <svg
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="h-6 w-6 cursor-pointer text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
      </div>

      {/* Mobile Menu */}
      <div
        className={`fixed top-0 left-0 w-full h-screen bg-white text-base flex flex-col md:hidden items-center justify-center gap-6 font-medium text-gray-800 transition-all duration-500 ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button className="absolute top-4 right-4" onClick={() => setIsMenuOpen(false)}>
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {[...staticLinks, ...authLinks].map((link, i) => (
          <Link
            key={i}
            to={link.path}
            onClick={(e) => {
              setIsMenuOpen(false);
              if (link.name === 'Logout') {
                e.preventDefault();
                handleLogout();
              }
            }}
            className="text-lg"
          >
            {link.name}
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default Navbar;