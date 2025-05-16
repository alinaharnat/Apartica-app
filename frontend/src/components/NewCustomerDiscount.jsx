import React from 'react';
import discountImg from '../assets/save-money.png';

const NewCustomerDiscount = () => {
    return (
        <div
            className="relative bg-white rounded-2xl p-4 flex items-center gap-4 mx-auto shadow-md"
            style={{ height: '130px', width: '100vw', maxWidth: '1200px', paddingLeft: '12px', paddingRight: '12px' }}
        >
            <div className="flex flex-col items-start justify-center flex-1 h-full">
                <h2 className="text-base font-bold text-gray-900 mb-1">
                    Register and save money
                </h2>

                <p className="text-gray-600 text-xs mb-3 max-w-full whitespace-nowrap overflow-hidden text-ellipsis">
                    Save 10% at your first booking – register now and receive a discount as a new customer
                </p>

                <button className="bg-[#8252A1] hover:bg-purple-800 transition-colors text-white font-semibold text-xs px-4 py-1 rounded-full">
                    Register now!
                </button>
            </div>

            <img
                src={discountImg}
                alt="Bee"
                className="object-contain flex-shrink-0"
                style={{ height: '90px', width: 'auto' }}
            />
        </div>
    );
};

export default NewCustomerDiscount;
