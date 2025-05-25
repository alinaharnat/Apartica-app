import React, { useState } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import enGB from 'date-fns/locale/en-GB';
import cn from 'classnames';
import hotel from '../assets/hotel1.jpg';
import 'react-datepicker/dist/react-datepicker.css';
import { useNavigate } from 'react-router-dom';

registerLocale('en-GB', enGB);

const Hero = () => {
  /* ---------- state ---------- */
  const [destination, setDestination] = useState('');
  const [checkIn, setCheckIn]       = useState(null);
  const [checkOut, setCheckOut]     = useState(null);
  const [guests, setGuests]         = useState('');
  const [errors, setErrors]         = useState({});

  const today = new Date(); today.setHours(0,0,0,0);
 const navigate = useNavigate();
  /* ---------- helpers ---------- */
  const validate = () => {
    const e = {};
    if (!destination.trim()) e.destination = 'Please enter destination';

    if (checkIn || checkOut) {
      if (!checkIn)  e.checkIn  = 'Select check-in';
      if (!checkOut) e.checkOut = 'Select check-out';
    }
    if (checkIn && checkIn < today)                     e.checkIn  = 'Past date';
    if (checkOut && checkOut < today)                   e.checkOut = 'Past date';
    if (checkIn && checkOut && checkOut <= checkIn)     e.checkOut = 'Must be after check-in';
    if (!guests || guests < 1)                          e.guests   = 'Add guests';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const v = validate();
    setErrors(v);
    if (!Object.keys(v).length) {
      // Формируем параметры для поиска
      const params = new URLSearchParams();
      params.append('location', destination);
      if (checkIn) params.append('checkIn', checkIn.toISOString());
      if (checkOut) params.append('checkOut', checkOut.toISOString());
      params.append('guests', guests);
      
      // Переходим на страницу результатов
      navigate(`/search?${params.toString()}`);
    }
  };

  const dateInputCls = (err) =>
    cn(
      'bg-transparent outline-none text-sm placeholder:text-gray-400 ' +
        'min-w-[112px] sm:min-w-[120px] lg:min-w-[136px]',
      err && 'border border-red-500 rounded'
    );

  return (
    <div className="relative w-full h-screen">
 
      <img src={hotel} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/40" />


      <div className="relative z-10 flex flex-col items-center justify-center h-full
                      px-4 sm:px-8 xl:px-16 py-10">

        <form
          noValidate
          onSubmit={handleSubmit}
          className="bg-[#FCF7F3]/90 shadow-md rounded-2xl lg:rounded-full
                     flex flex-wrap lg:flex-nowrap gap-x-6 gap-y-4 items-center
                     w-full max-w-[950px] px-6 py-4"
        >
          <div className="flex flex-col flex-1 min-w-[150px]">
            <label className="text-xs font-semibold text-gray-700">Where</label>
            <input
              list="destinations"
              placeholder="Search destination"
              className={cn(
                'bg-transparent outline-none placeholder:text-gray-400 text-sm',
                errors.destination && 'border border-red-500 rounded'
              )}
              value={destination}
              onChange={(e)=>{ setDestination(e.target.value);
                               setErrors(p=>({...p,destination:undefined}));}}
            />
            {errors.destination && (
              <span className="text-xs text-red-500">{errors.destination}</span>
            )}
            <datalist id="destinations">
              <option value="New York"/><option value="Paris"/>
              <option value="Tokyo"/><option value="London"/>
            </datalist>
          </div>

          <div className="flex flex-col border-l lg:border-l border-gray-300
                          pl-0 lg:pl-6 lg:flex-1 min-w-[150px]">
            <label className="text-xs font-semibold text-gray-700 lg:pl-0 pl-6">
              Check in
            </label>
            <DatePicker
              selected={checkIn}
              onChange={(d)=>{ setCheckIn(d);
                               if(d && checkOut && d>=checkOut) setCheckOut(null);
                               setErrors(p=>({...p,checkIn:undefined,checkOut:undefined}));}}
              dateFormat="dd.MM.yyyy"
              placeholderText="Add date"
              minDate={today}
              locale="en-GB"
              className={dateInputCls(errors.checkIn)}
              wrapperClassName="pl-6 lg:pl-0"
              popperPlacement="bottom-start"
              dayClassName={(d)=>
                cn('react-datepicker__day',
                   checkIn&&checkOut&&d>=checkIn&&d<=checkOut&&'bg-[#8252A1] text-white rounded-full',
                   d.getTime()===checkIn?.getTime()&&'bg-[#8252A1] text-white')}
            />
            {errors.checkIn && (
              <span className="text-xs text-red-500 pl-6 lg:pl-0">{errors.checkIn}</span>
            )}
          </div>

          <div className="flex flex-col border-l lg:border-l border-gray-300
                          pl-0 lg:pl-6 lg:flex-1 min-w-[150px]">
            <label className="text-xs font-semibold text-gray-700 lg:pl-0 pl-6">
              Check out
            </label>
            <DatePicker
              selected={checkOut}
              onChange={(d)=>{ setCheckOut(d);
                               setErrors(p=>({...p,checkOut:undefined}));}}
              dateFormat="dd.MM.yyyy"
              placeholderText="Add date"
              minDate={checkIn||today}
              locale="en-GB"
              className={dateInputCls(errors.checkOut)}
              wrapperClassName="pl-6 lg:pl-0"
              popperPlacement="bottom-start"
              dayClassName={(d)=>
                cn('react-datepicker__day',
                   checkIn&&checkOut&&d>=checkIn&&d<=checkOut&&'bg-[#8252A1] text-white rounded-full',
                   d.getTime()===checkOut?.getTime()&&'bg-[#8252A1] text-white')}
            />
            {errors.checkOut && (
              <span className="text-xs text-red-500 pl-6 lg:pl-0">{errors.checkOut}</span>
            )}
          </div>

          <div className="flex flex-col border-l border-gray-300 pl-6 min-w-[110px]">
            <label className="text-xs font-semibold text-gray-700">Who</label>
            <input
              type="number" min={1} max={10} placeholder="Add guests"
              className={cn(
                'bg-transparent outline-none text-sm placeholder:text-gray-400 min-w-[96px]',
                errors.guests && 'border border-red-500 rounded')}
              value={guests}
              onChange={(e)=>{ setGuests(e.target.value);
                               setErrors(p=>({...p,guests:undefined}));}}
            />
            {errors.guests && (
              <span className="text-xs text-red-500">{errors.guests}</span>
            )}
          </div>

          <button
            type="submit"
            className="ml-auto lg:ml-6 bg-[#8252A1] hover:bg-purple-800
                       transition-colors rounded-full p-3 w-full sm:w-auto"
          >
            <svg className="w-5 h-5 text-white mx-auto" xmlns="http://www.w3.org/2000/svg"
                 fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                    d="M21 21l-3.5-3.5M17 10a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </button>
        </form>

        <h1 className="text-white font-bold text-center text-base sm:text-lg mt-10">
          Your ideal hotel stay is just a few clicks away!
        </h1>
      </div>
    </div>
  );
};

export default Hero;
