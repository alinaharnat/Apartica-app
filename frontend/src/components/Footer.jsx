import React from "react";
import telegram from '../assets/telegram.png';
import facebook from '../assets/facebook.png';
import instagram from '../assets/instagram.png';
import twitter from '../assets/twitter.png';
import flag from '../assets/flag.png';
import bee from '../assets/bee.jpg';

const Footer = () => {
  return (
    <footer className="w-full bg-[#ffffff] text-center text-sm py-4">
      <div className="flex flex-wrap justify-between items-center max-w-full px-4 md:px-12">
        {/* Left block (Logo + Language/Currency/About) */}
       <div className="flex items-center gap-3 text-xs md:text-sm text-gray-700">
  {/* Прапор і English */}
  <span className="flex items-center gap-1">
    <img src={flag} className="h-4 w-auto" />
    <span>English</span>
  </span>

  {/* Валюта */}
  <span>EUR</span>

  {/* About us */}
 <a href="#" className="!text-gray-700 font-semibold ">About us</a>



</div>

        {/* Center block (Description + Copyright + Group) */}
        <div className="text-xs text-gray-500 text-center mx-auto mt-3 md:mt-0">
          <p>
            Apratica is part of Shmel’s Group, the world leader in every possible field.
          </p>
          <p className="text-[11px]">Copyright © 1989–2025 “Apratica”. All rights reserved.</p>
          <div className="mt-1">
            <img src={bee} alt="" className="h-5 inline-block" />
            <span className="ml-1 font-semibold">Shmel’s Group</span>
          </div>
        </div>

        {/* Right block (Social Icons) */}
        <div className="flex items-center gap-4 mt-3 md:mt-0">
  <a href="#" className="text-purple-400 hover:text-purple-600">
    <img src={telegram} alt="Telegram" className="w-5 h-5" />
  </a>
  <a href="#" className="text-purple-400 hover:text-purple-600">
    <img src={facebook} alt="Facebook" className="w-5 h-5" />
  </a>
  <a href="#" className="text-purple-400 hover:text-purple-600">
    <img src={instagram} alt="Instagram" className="w-5 h-5" />
  </a>
  <a href="#" className="text-purple-400 hover:text-purple-600">
    <img src={twitter} alt="Twitter" className="w-5 h-5" />
  </a>
</div>


      </div>
    </footer>
  );
};

export default Footer;
