import React, { useState, useEffect, useRef } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import enGB from 'date-fns/locale/en-GB';
import cn from 'classnames';
import hotel from '../assets/hotel1.jpg';
import 'react-datepicker/dist/react-datepicker.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Custom debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

registerLocale('en-GB', enGB);

const Hero = () => {
  const [destination, setDestination] = useState('');
  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const [guests, setGuests] = useState('');
  const [errors, setErrors] = useState({});
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [apiError, setApiError] = useState(null);

  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const formRef = useRef(null);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const navigate = useNavigate();

  const debouncedDestination = useDebounce(destination, 400);

  useEffect(() => {
    const fetchCitySuggestions = async () => {
      if (debouncedDestination.trim().length < 2) {
        setCitySuggestions([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setApiError(null);
      try {
        const response = await axios.get(
          `http://localhost:5000/api/cities/search?q=${encodeURIComponent(debouncedDestination)}`
        );
        setCitySuggestions(response.data);
      } catch (error) {
        console.error('Error fetching city suggestions:', error);
        setApiError('Failed to load suggestions. Please try again.');
        setCitySuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (showSuggestions) {
      fetchCitySuggestions();
    }
  }, [debouncedDestination, showSuggestions]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!showSuggestions) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < citySuggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : citySuggestions.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < citySuggestions.length) {
            handleSuggestionSelect(citySuggestions[highlightedIndex].name);
          }
          break;
        case 'Escape':
          e.preventDefault();
          closeSuggestions();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showSuggestions, citySuggestions, highlightedIndex]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        inputRef.current && 
        !inputRef.current.contains(e.target) &&
        suggestionsRef.current && 
        !suggestionsRef.current.contains(e.target)
      ) {
        closeSuggestions();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const closeSuggestions = () => {
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  };

  const validate = () => {
    const e = {};
    if (!destination.trim()) e.destination = 'Please enter a destination';
    else if (destination.trim().length < 2)
      e.destination = 'Destination must be at least 2 characters';
    if (!checkIn) e.checkIn = 'Select check-in';
    if (!checkOut) e.checkOut = 'Select check-out';
    if (checkIn && checkIn < today) e.checkIn = 'Past date';
    if (checkOut && checkOut < today) e.checkOut = 'Past date';
    if (checkIn && checkOut && checkOut <= checkIn)
      e.checkOut = 'Must be after check-in';
    if (!guests || guests < 1) e.guests = 'Add guests';

    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
  
    if (Object.keys(validationErrors).length === 0) {
      const params = new URLSearchParams();
      params.append('city', destination);
      
      if (checkIn) {
        // Создаем дату в локальном времени и форматируем как YYYY-MM-DD
        const localDate = new Date(checkIn);
        localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
        params.append('checkIn', localDate.toISOString().split('T')[0]);
      }
      
      if (checkOut) {
        const localDate = new Date(checkOut);
        localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
        params.append('checkOut', localDate.toISOString().split('T')[0]);
      }
      
      params.append('guests', guests);
      navigate(`/search?${params.toString()}`);
    }
  };

  const handleSuggestionSelect = (cityName) => {
    setDestination(cityName);
    closeSuggestions();
    setErrors((prev) => ({ ...prev, destination: undefined }));
    setApiError(null);
    inputRef.current?.focus();
  };

  const handleClearInput = () => {
    setDestination('');
    setShowSuggestions(false);
    setErrors((prev) => ({ ...prev, destination: undefined }));
    setApiError(null);
    inputRef.current?.focus();
  };

  const handleInputChange = (e) => {
    setDestination(e.target.value);
    setErrors((prev) => ({ ...prev, destination: undefined }));
    setShowSuggestions(e.target.value.length > 0);
  };

  const handleInputFocus = () => {
    if (destination.length > 0) {
      setShowSuggestions(true);
    }
  };

  const dateInputCls = (error) =>
    cn(
      'bg-transparent outline-none text-sm placeholder:text-gray-400 min-w-[112px] sm:min-w-[120px] lg:min-w-[136px]',
      error && 'border border-red-500 rounded'
    );

  return (
    <div className="relative w-full h-screen">
      <img src={hotel} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 sm:px-8 xl:px-16 py-10">
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="bg-[#FCF7F3]/90 shadow-md rounded-2xl lg:rounded-full flex flex-wrap lg:flex-nowrap gap-x-6 gap-y-4 items-center w-full max-w-[950px] px-6 py-4"
        >
          {/* Destination Input */}
          <div className="flex flex-col flex-1 min-w-[150px] relative">
            <label
              htmlFor="destination"
              className="text-xs font-semibold text-gray-700"
            >
              Where
            </label>
            <div className="relative">
              <input
                id="destination"
                ref={inputRef}
                type="text"
                placeholder="Search destination"
                className={cn(
                  'w-full text-sm bg-transparent outline-none pr-10',
                  errors.destination && 'border border-red-500 rounded'
                )}
                value={destination}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                aria-autocomplete="list"
                aria-controls="suggestions-list"
                aria-expanded={showSuggestions}
                aria-activedescendant={
                  highlightedIndex >= 0
                    ? `suggestion-${highlightedIndex}`
                    : undefined
                }
              />
              {destination && (
                <button
                  type="button"
                  onClick={handleClearInput}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label="Clear destination input"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
              {isLoading && (
                <div className="absolute right-0 top-0 bottom-0 flex items-center pr-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                </div>
              )}
            </div>
            {errors.destination && (
              <p className="text-xs text-red-500 mt-1">{errors.destination}</p>
            )}
            {apiError && (
              <p className="text-xs text-red-500 mt-1">{apiError}</p>
            )}

            {showSuggestions && (
              <div
                ref={suggestionsRef}
                id="suggestions-list"
                role="listbox"
                className="absolute top-full left-0 right-0 mt-1 bg-white shadow-lg rounded-md overflow-hidden z-10 border border-gray-200"
              >
                {citySuggestions.length > 0 ? (
                  <ul className="py-1 max-h-60 overflow-auto">
                    {citySuggestions.map((city, index) => (
                      <li
                        key={city.id}
                        id={`suggestion-${index}`}
                        role="option"
                        aria-selected={highlightedIndex === index}
                        className={cn(
                          'px-4 py-2 cursor-pointer transition-colors duration-150',
                          highlightedIndex === index
                            ? 'bg-purple-100'
                            : 'hover:bg-gray-50'
                        )}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSuggestionSelect(city.name)}
                        onMouseEnter={() => setHighlightedIndex(index)}
                      >
                        <div className="font-medium text-gray-800">{city.name}</div>
                        <div className="text-xs text-gray-500">{city.country}</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-4 py-3 text-gray-500 text-center text-sm">
                    {debouncedDestination.length > 0
                      ? 'No results found'
                      : 'Start typing to search cities'}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Check-in Date */}
          <div className="flex flex-col border-l border-gray-300 pl-6 lg:flex-1 min-w-[150px]">
            <label className="text-xs font-semibold text-gray-700">Check in</label>
            <DatePicker
              selected={checkIn}
              onChange={(date) => {
                setCheckIn(date);
                if (date && checkOut && date >= checkOut) setCheckOut(null);
                setErrors((prev) => ({
                  ...prev,
                  checkIn: undefined,
                  checkOut: undefined,
                }));
              }}
              selectsStart
              startDate={checkIn}
              endDate={checkOut}
              minDate={today}
              placeholderText="Add date"
              className={dateInputCls(errors.checkIn)}
              dateFormat="dd.MM.yyyy"
              locale="en-GB"
              popperPlacement="bottom-start"
            />
            {errors.checkIn && (
              <p className="text-xs text-red-500 mt-1">{errors.checkIn}</p>
            )}
          </div>

          {/* Check-out Date */}
          <div className="flex flex-col border-l border-gray-300 pl-6 lg:flex-1 min-w-[150px]">
            <label className="text-xs font-semibold text-gray-700">Check out</label>
            <DatePicker
              selected={checkOut}
              onChange={(date) => {
                setCheckOut(date);
                setErrors((prev) => ({ ...prev, checkOut: undefined }));
              }}
              selectsEnd
              startDate={checkIn}
              endDate={checkOut}
              minDate={checkIn || today}
              placeholderText="Add date"
              className={dateInputCls(errors.checkOut)}
              dateFormat="dd.MM.yyyy"
              locale="en-GB"
              popperPlacement="bottom-start"
            />
            {errors.checkOut && (
              <p className="text-xs text-red-500 mt-1">{errors.checkOut}</p>
            )}
          </div>

          {/* Guests Input */}
          <div className="flex flex-col border-l border-gray-300 pl-6 min-w-[110px]">
            <label className="text-xs font-semibold text-gray-700">Who</label>
            <input
              type="number"
              min={1}
              max={10}
              placeholder="Add guests"
              className={cn(
                'bg-transparent outline-none text-sm placeholder:text-gray-400 min-w-[96px]',
                errors.guests && 'border border-red-500 rounded'
              )}
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
            />
            {errors.guests && (
              <p className="text-xs text-red-500 mt-1">{errors.guests}</p>
            )}
          </div>

          {/* Search Button */}
          <button
            type="submit"
            className="ml-auto lg:ml-6 bg-[#8252A1] hover:bg-purple-800 transition-colors rounded-full p-3 w-full sm:w-auto"
          >
            <svg
              className="w-5 h-5 text-white mx-auto"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
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