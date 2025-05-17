import React, { useState } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { format } from 'date-fns';
import enGB from 'date-fns/locale/en-GB';
import cn from 'classnames';
import hotel from '../assets/hotel1.jpg';
import 'react-datepicker/dist/react-datepicker.css';

registerLocale('en-GB', enGB);

const Hero = () => {
  const [destination, setDestination] = useState('');
  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const [guests, setGuests] = useState('');
  const [errors, setErrors] = useState({});

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  /* -------- helpers -------- */
  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!destination.trim()) newErrors.destination = 'Please enter destination';

    if (checkIn || checkOut) {
      if (!checkIn) newErrors.checkIn = 'Please select check-in';
      if (!checkOut) newErrors.checkOut = 'Please select check-out';
    }
    if (checkIn && checkIn < today) newErrors.checkIn = 'Check-in in the past';
    if (checkOut && checkOut < today) newErrors.checkOut = 'Check-out in the past';
    if (checkIn && checkOut && checkOut <= checkIn)
      newErrors.checkOut = 'Check-out must be after check-in';

    if (!guests || guests < 1) newErrors.guests = 'Add at least one guest';

    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      /* …відправляємо… */
      console.log({ destination, checkIn, checkOut, guests });
    }
  };

  /* -------- date-picker classes -------- */
  const dateInputCls = (error) =>
    cn(
      'bg-transparent outline-none text-sm placeholder:text-gray-400 w-28 sm:w-32 md:w-36',
      error && 'border border-red-500 rounded'
    );

  return (
    <div className="relative w-full h-screen">
      {/* bg image */}
      <img
        src={hotel}
        alt="Hotel"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/40" />

      {/* content */}
      <div className="relative z-10 flex flex-col items-center h-full px-4 md:px-10 lg:px-16 py-10">
        {/* SEARCH FORM */}
        <form
          noValidate
          onSubmit={handleSubmit}
          className="bg-[#FCF7F3]/90 rounded-2xl md:rounded-full shadow-md flex flex-wrap sm:flex-nowrap gap-x-6 gap-y-4 items-center w-full max-w-[900px] px-6 py-4"
          style={{ marginBlock: 'auto' }}
        >
          {/* DESTINATION */}
          <div className="flex flex-col flex-1 min-w-[140px]">
            <label className="text-xs font-semibold text-gray-700">Where</label>
            <input
              list="destinations"
              placeholder="Search destination"
              className={cn(
                'bg-transparent outline-none text-sm placeholder:text-gray-400',
                errors.destination && 'border border-red-500 rounded'
              )}
              value={destination}
              onChange={(e) => {
                setDestination(e.target.value);
                setErrors((p) => ({ ...p, destination: undefined }));
              }}
            />
            {errors.destination && (
              <span className="text-red-500 text-xs">{errors.destination}</span>
            )}
            <datalist id="destinations">
              <option value="New York" />
              <option value="Paris" />
              <option value="Tokyo" />
              <option value="London" />
            </datalist>
          </div>

          {/* CHECK-IN */}
          <div className="flex flex-col border-l border-gray-300 pl-6">
            <label className="text-xs font-semibold text-gray-700">Check in</label>
            <DatePicker
              selected={checkIn}
              onChange={(date) => {
                setCheckIn(date);
                if (date && checkOut && date >= checkOut) setCheckOut(null);
                setErrors((p) => ({ ...p, checkIn: undefined, checkOut: undefined }));
              }}
              dateFormat="dd.MM.yyyy"
              placeholderText="Add date"
              minDate={today}
              locale="en-GB"
              className={dateInputCls(errors.checkIn)}
              popperPlacement="bottom-start"
              wrapperClassName="w-full"
              dayClassName={(d) =>
                cn(
                  'react-datepicker__day',
                  checkIn &&
                    checkOut &&
                    d >= checkIn &&
                    d <= checkOut &&
                    'bg-[#8252A1] text-white rounded-full',
                  d.getTime() === checkIn?.getTime() && 'bg-[#8252A1] text-white'
                )
              }
            />
            {errors.checkIn && (
              <span className="text-red-500 text-xs">{errors.checkIn}</span>
            )}
          </div>

          {/* CHECK-OUT */}
          <div className="flex flex-col border-l border-gray-300 pl-6">
            <label className="text-xs font-semibold text-gray-700">Check out</label>
            <DatePicker
              selected={checkOut}
              onChange={(date) => {
                setCheckOut(date);
                setErrors((p) => ({ ...p, checkOut: undefined }));
              }}
              dateFormat="dd.MM.yyyy"
              placeholderText="Add date"
              minDate={checkIn || today}
              locale="en-GB"
              className={dateInputCls(errors.checkOut)}
              popperPlacement="bottom-start"
              wrapperClassName="w-full"
              dayClassName={(d) =>
                cn(
                  'react-datepicker__day',
                  checkIn &&
                    checkOut &&
                    d >= checkIn &&
                    d <= checkOut &&
                    'bg-[#8252A1] text-white rounded-full',
                  d.getTime() === checkOut?.getTime() && 'bg-[#8252A1] text-white'
                )
              }
            />
            {errors.checkOut && (
              <span className="text-red-500 text-xs">{errors.checkOut}</span>
            )}
          </div>

          {/* GUESTS */}
          <div className="flex flex-col border-l border-gray-300 pl-6">
            <label className="text-xs font-semibold text-gray-700">Who</label>
            <input
              type="number"
              min={1}
              max={10}
              placeholder="Add guests"
              className={cn(
                'bg-transparent outline-none text-sm placeholder:text-gray-400 w-20',
                errors.guests && 'border border-red-500 rounded'
              )}
              value={guests}
              onChange={(e) => {
                setGuests(e.target.value);
                setErrors((p) => ({ ...p, guests: undefined }));
              }}
            />
            {errors.guests && (
              <span className="text-red-500 text-xs">{errors.guests}</span>
            )}
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            className="ml-auto bg-[#8252A1] hover:bg-purple-800 transition-colors rounded-full p-3"
          >
            <svg
              className="w-5 h-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-3.5-3.5M17 10a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>
        </form>

        {/* tagline */}
        <h1 className="text-white font-bold mt-10 text-center text-base sm:text-lg">
          Your ideal hotel stay is just a few clicks away!
        </h1>
      </div>
    </div>
  );
};

export default Hero;
