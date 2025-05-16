import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.svg';

const Navbar = () => {
    const navigate = useNavigate();

    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) setUser(JSON.parse(stored));
    }, []);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        navigate('/');
    };

    const staticLinks = [
        { name: 'Home', path: '/' },
        { name: 'List your property', path: '/' },
    ];

    const authLinks = user
      ? [
          { name: `${user.displayName || user.name}`, path: '#' },
          { name: 'Logout', path: '#' }
      ]
      : [
          { name: 'Register', path: '/login' },
          { name: 'Sign in', path: '/login' }
      ];

    return (
      <div className="bg-[#FFF8F2] font-montserrat">
          <nav className={`fixed top-0 left-0 w-full flex items-center justify-between px-4 md:px-16 lg:px-24 xl:px-32 transition-all duration-500 z-50 ${isScrolled ? "bg-[#8252A1] shadow-md py-3 md:py-4" : "bg-[#8252A1] py-4 md:py-6"}`}>
              {/* Logo */}
              <Link to="/" className="flex items-center gap-2">
                  <img src={logo} alt="logo" className={`h-9 ${isScrolled ? "opacity-80" : ""}`} />
              </Link>

              {/* Desktop Nav */}
              <div className="hidden md:flex items-center gap-4 lg:gap-8">
                  {[...staticLinks, ...authLinks].map((link, i) =>
                    link.name === 'Logout' ? (
                      <a
                        key={i}
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            handleLogout();
                        }}
                        className="group flex flex-col gap-0.5 text-white text-sm"
                      >
                          {link.name}
                          <div className="bg-white h-0.5 w-0 group-hover:w-full transition-all duration-300" />
                      </a>
                    ) : (
                      <Link
                        key={i}
                        to={link.path}
                        onClick={() => setIsMenuOpen(false)}
                        className="group flex flex-col gap-0.5 text-white text-sm"
                      >
                          {link.name}
                          <div className="bg-white h-0.5 w-0 group-hover:w-full transition-all duration-300" />
                      </Link>
                    )
                  )}
              </div>

              {/* Mobile Menu Button */}
              <div className="flex items-center gap-3 md:hidden">
                  <svg onClick={() => setIsMenuOpen(!isMenuOpen)} className="h-6 w-6 cursor-pointer text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <line x1="4" y1="6" x2="20" y2="6" />
                      <line x1="4" y1="12" x2="20" y2="12" />
                      <line x1="4" y1="18" x2="20" y2="18" />
                  </svg>
              </div>

              {/* Mobile Menu */}
              <div className={`fixed top-0 left-0 w-full h-screen bg-white text-base flex flex-col md:hidden items-center justify-center gap-6 font-medium text-gray-800 transition-all duration-500 ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
                  <button className="absolute top-4 right-4" onClick={() => setIsMenuOpen(false)}>
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                  </button>

                  {[...staticLinks, ...authLinks].map((link, i) =>
                    link.name === 'Logout' ? (
                      <a
                        key={i}
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            handleLogout();
                        }}
                      >
                          {link.name}
                      </a>
                    ) : (
                      <Link key={i} to={link.path} onClick={() => setIsMenuOpen(false)}>
                          {link.name}
                      </Link>
                    )
                  )}
              </div>
          </nav>

          {/* Dummy scroll area */}
          {/*<div className="h-[2000px] bg-[#FFF8F2]"></div>*/}
      </div>
    );
};

export default Navbar;
