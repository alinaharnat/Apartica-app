import React, { useState } from 'react';
import hotel from '../assets/hotel1.jpg';

const Hero = () => {
    const [destination, setDestination] = useState('');
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [guests, setGuests] = useState('');
    const [errors, setErrors] = useState({});

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const handleSubmit = (e) => {
        e.preventDefault();
        // Валідація
        const newErrors = {};
        if (!destination.trim()) newErrors.destination = 'Please enter destination';
        if (!checkIn) newErrors.checkIn = 'Please select check-in date';
        else if (new Date(checkIn) < today) newErrors.checkIn = 'Check-in date cannot be in the past';
        if (!checkOut) newErrors.checkOut = 'Please select check-out date';
        else if (new Date(checkOut) < today) newErrors.checkOut = 'Check-out date cannot be in the past';
        if (checkIn && checkOut && new Date(checkOut) <= new Date(checkIn)) newErrors.checkOut = 'Check-out date must be after check-in date';
        if (!guests || guests < 1) newErrors.guests = 'Please add at least one guest';
        setErrors(newErrors);
    };

    const handleChange = (field, value) => {
        switch (field) {
            case 'destination':
                setDestination(value);
                if (errors.destination) setErrors(prev => { const { destination, ...rest } = prev; return rest; });
                break;
            case 'checkIn':
                setCheckIn(value);
                if (errors.checkIn || errors.checkOut) setErrors(prev => { const { checkIn, checkOut, ...rest } = prev; return rest; });
                break;
            case 'checkOut':
                setCheckOut(value);
                if (errors.checkOut) setErrors(prev => { const { checkOut, ...rest } = prev; return rest; });
                break;
            case 'guests':
                setGuests(value);
                if (errors.guests) setErrors(prev => { const { guests, ...rest } = prev; return rest; });
                break;
            default:
                break;
        }
    };

    return (
        <div className="relative w-full h-screen">
            {/* Картинка на весь екран */}
            <img
                src={hotel}
                alt="Hotel"
                className="absolute top-0 left-0 w-full h-full object-cover"
            />

            {/* Напівпрозорий шар для кращої читабельності */}
            <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-40"></div>

            {/* Контент поверх картинки */}
            <div className="relative z-10 flex flex-col items-center justify-between h-full px-6 md:px-16 lg:px-24 xl:px-32 py-16">

                {/* Форма приблизно посередині картинки (вертикально) */}
                <form
                    noValidate
                    onSubmit={handleSubmit}
                    className="bg-[#FCF7F3] bg-opacity-90 rounded-full px-6 py-3 flex items-center gap-6 max-w-[900px] w-full shadow-md"
                    style={{ marginTop: 'auto', marginBottom: 'auto' }}
                >
                    {/* Поля форми */}
                    <div className="flex flex-col">
                        <label className="text-xs text-gray-700 font-semibold">Where</label>
                        <input
                            list="destinations"
                            id="destinationInput"
                            type="text"
                            placeholder="Search destinations"
                            className={`bg-transparent placeholder:text-gray-400 text-black outline-none text-sm w-36 md:w-48 ${errors.destination ? 'border border-red-500 rounded' : ''
                                }`}
                            value={destination}
                            onChange={(e) => handleChange('destination', e.target.value)}
                        />
                        {errors.destination && (
                            <span className="text-red-500 text-xs mt-1">{errors.destination}</span>
                        )}
                        <datalist id="destinations">
                            <option value="New York" />
                            <option value="Paris" />
                            <option value="Tokyo" />
                            <option value="London" />
                        </datalist>
                    </div>

                    <div className="flex flex-col border-l border-gray-300 pl-6">
                        <label className="text-xs text-gray-700 font-semibold">Check in</label>
                        <input
                            id="checkIn"
                            type="date"
                            className={`bg-transparent placeholder:text-gray-400 text-black outline-none text-sm w-28 ${errors.checkIn ? 'border border-red-500 rounded' : ''
                                }`}
                            value={checkIn}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(e) => handleChange('checkIn', e.target.value)}
                        />
                        {errors.checkIn && (
                            <span className="text-red-500 text-xs mt-1">{errors.checkIn}</span>
                        )}
                    </div>

                    <div className="flex flex-col border-l border-gray-300 pl-6">
                        <label className="text-xs text-gray-700 font-semibold">Check out</label>
                        <input
                            id="checkOut"
                            type="date"
                            className={`bg-transparent placeholder:text-gray-400 text-black outline-none text-sm w-28 ${errors.checkOut ? 'border border-red-500 rounded' : ''
                                }`}
                            min={checkIn || new Date().toISOString().split('T')[0]}
                            value={checkOut}
                            onChange={(e) => handleChange('checkOut', e.target.value)}
                        />
                        {errors.checkOut && (
                            <span className="text-red-500 text-xs mt-1">{errors.checkOut}</span>
                        )}
                    </div>

                    <div className="flex flex-col border-l border-gray-300 pl-6">
                        <label className="text-xs text-gray-700 font-semibold">Who</label>
                        <input
                            min={1}
                            max={10}
                            id="guests"
                            type="number"
                            placeholder="Add guests"
                            className={`bg-transparent placeholder:text-gray-400 text-black outline-none text-sm w-20 ${errors.guests ? 'border border-red-500 rounded' : ''
                                }`}
                            value={guests}
                            onChange={(e) => handleChange('guests', e.target.value)}
                        />
                        {errors.guests && (
                            <span className="text-red-500 text-xs mt-1">{errors.guests}</span>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="ml-auto bg-[#8252A1] hover:bg-purple-800 transition-colors rounded-full p-3 flex items-center justify-center"
                    >
                        <svg
                            className="w-5 h-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-3.5-3.5M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </button>
                </form>

                {/* Текст знизу картинки */}
                <h1 className="text-white text-3xl font-bold mt-12">Hotels</h1>
            </div>
        </div>
    );
};

export default Hero;
