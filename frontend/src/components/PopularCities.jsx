import { useEffect, useRef, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function PopularCities() {
  const [cities, setCities] = useState([]);
  const [error, setError] = useState(null);


  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const scrollContainerRef = useRef(null);


  const updateScrollButtons = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
  }, []);

  const scrollByPx = (px) => {
    scrollContainerRef.current?.scrollBy({ left: px, behavior: 'smooth' });
  };


  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/popular-cities');
        if (!res.ok) throw new Error('Network response was not ok');
        const data = await res.json();
        setCities(data);
      } catch (e) {
        setError(e.message);
      }
    };
    fetchCities();
  }, []);

  useEffect(() => updateScrollButtons(), [cities, updateScrollButtons]);


  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    el.addEventListener('scroll', updateScrollButtons, { passive: true });
    return () => el.removeEventListener('scroll', updateScrollButtons);
  }, [updateScrollButtons]);

  if (error)
    return <div className="text-red-500 text-center mt-4">Помилка: {error}</div>;

  return (
    <div className="p-6 relative">
      <h1 className="text-3xl font-bold mb-6 text-center">Популярні міста</h1>

      {canScrollLeft && (
        <button
          onClick={() => scrollByPx(-300)}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white rounded-full shadow-md p-2 hover:bg-gray-100 z-10"
        >
          <ChevronLeft size={24} />
        </button>
      )}

   
      {canScrollRight && (
        <button
          onClick={() => scrollByPx(300)}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white rounded-full shadow-md p-2 hover:bg-gray-100 z-10"
        >
          <ChevronRight size={24} />
        </button>
      )}

     
      <div
        ref={scrollContainerRef}
        className="flex space-x-4 overflow-x-scroll scrollbar-hide scroll-smooth pb-4"
      >
        {cities.map((city) => (
          <div
            key={city._id}
            className="min-w-[250px] bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow flex-shrink-0"
          >
            <img
              src={
                city.imageUrl.startsWith('http')
                  ? city.imageUrl
                  : `http://localhost:5000${city.imageUrl}`
              }
              alt={city.name}
              className="w-full h-48 object-cover rounded-t-lg"
            />
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-2">{city.name}</h2>
              <p className="text-gray-600">Країна: {city.country}</p>
              <p className="text-gray-600">Обʼєктів: {city.propertyCount}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PopularCities;
