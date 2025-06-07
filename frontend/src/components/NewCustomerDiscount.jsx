import React from 'react';
import discountImg from '../assets/save-money.png';
import { useNavigate } from 'react-router-dom';

const NewCustomerDiscount = () => {
  const navigate = useNavigate();

  const register = async () => {
    navigate('/auth?mode=register');
  }

  return (
    <div className="w-full flex justify-center px-3">
      <div
        className="
          relative w-full max-w-[1200px] bg-white shadow-md rounded-2xl
          flex flex-col sm:flex-row items-center sm:items-start gap-4
          py-4 px-4 sm:py-5 sm:px-6
        "
      >
        <div className="flex flex-col sm:flex-1 items-start">
          <h2 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 mb-1">
            Register and save money
          </h2>

          <p className="
              text-gray-600 text-xs sm:text-sm lg:text-base
              mb-3 sm:mb-4
              sm:max-w-none max-w-full overflow-hidden text-ellipsis
            ">
            Save&nbsp;10% at your first booking – register now and receive a discount as a new customer
          </p>

          <button
            onClick={() => navigate('/auth?mode=register')}
            className="
              bg-[#8252A1] hover:bg-purple-800 transition-colors
              text-white font-semibold
              text-xs sm:text-sm lg:text-base
              px-4 py-1.5 rounded-full
            ">
            Register now!
          </button>
        </div>

        <img
          src={discountImg}
          alt="Save money"
          className="
            flex-shrink-0 object-contain
            h-20 sm:h-[90px] lg:h-[100px] w-auto
          "
        />
      </div>
    </div>
  );
};

export default NewCustomerDiscount;
