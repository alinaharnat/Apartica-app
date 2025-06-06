// src/components/Footer.jsx
import React from "react";
import telegram from '../assets/telegram.png';
import facebook from '../assets/facebook.png';
import instagram from '../assets/instagram.png';
import twitter from '../assets/twitter.png';
import flag from '../assets/flag.png';
import bee from '../assets/shmel_logo.png';
import { Link } from 'react-router-dom'; // <-- ІМПОРТУЙТЕ LINK

const Footer = () => {
  const currentYear = new Date().getFullYear(); // Динамічний рік

  return (
    <footer className="w-full bg-[#ffffff] text-center text-sm py-4 mt-auto"> {/* mt-auto допоможе притиснути футер донизу, якщо контенту мало */}
      <div className="container mx-auto flex flex-wrap justify-between items-center max-w-full px-4 md:px-12"> {/* Додав container mx-auto для кращого центрування */}
        {/* Left block (Language/Currency/Links) */}
        <div className="flex items-center gap-x-4 gap-y-2 text-xs md:text-sm text-gray-700 flex-wrap"> {/* Додав flex-wrap та gap-y-2 для кращого переносу на малих екранах */}
          <span className="flex items-center gap-1">
            <img src={flag} alt="Currency Flag" className="h-4 w-auto" /> {/* Додав alt для зображення */}
            <span>EUR</span>
          </span>
          <Link to="/rules" className="text-gray-700 font-semibold hover:text-purple-600 transition-colors duration-200">
             About us
          </Link>
        </div>

        {/* Center block (Description + Copyright + Group) */}
        <div className="w-full md:w-auto text-xs text-gray-500 text-center mx-auto mt-4 md:mt-0"> {/* Додав w-full для кращого центрування на моб. */}
          <p>
            Apartica is part of Shmel’s Group, the world leader in every possible field.
          </p>
          <p className="text-[11px]">Copyright © 1989–{currentYear} “Apartica”. All rights reserved.</p> {/* Використано динамічний рік */}
          <div className="mt-1 flex items-center justify-center"> {/* Додав flex для центрування логотипу і тексту */}
            <img src={bee} alt="Shmel's Group Logo" className="h-5 inline-block" /> {/* Додав alt */}
            <span className="ml-1 font-semibold text-gray-700"></span> {/* Змінив колір для кращої видимості */}
          </div>
        </div>

        {/* Right block (Social Icons) */}
        <div className="flex items-center gap-4 mt-4 md:mt-0"> {/* Змінив gap-3 на gap-4 для відповідності іншим блокам */}
          <a href="https://t.me/apartica" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-purple-600 transition-colors duration-200"> {/* Змінив колір, додав target та rel */}
            <img src={telegram} alt="Telegram" className="w-5 h-5" />
          </a>
          <a href="https://www.facebook.com/share/191nqYBu8a/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-purple-600 transition-colors duration-200">
            <img src={facebook} alt="Facebook" className="w-5 h-5" />
          </a>
          <a href="https://www.instagram.com/apartica.stay?igsh=MTdrZ2hwMG94MzhocA==" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-purple-600 transition-colors duration-200">
            <img src={instagram} alt="Instagram" className="w-5 h-5" />
          </a>
          <a href="https://x.com/apartica_stay" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-purple-600 transition-colors duration-200">
            <img src={twitter} alt="Twitter" className="w-5 h-5" />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;