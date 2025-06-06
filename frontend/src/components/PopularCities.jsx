import { useEffect, useRef, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom'; // імпортуємо Link для перенаправлення

function PopularCities() {
  const [cities, setCities] = useState([]);
  const [error, setError] = useState(null);

  // прапорці для видимості стрілок
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const scrollContainerRef = useRef(null);

  /* -------- helpers -------- */
  const updateScrollButtons = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
  }, []);

  const scrollByPx = (px) =>
    scrollContainerRef.current?.scrollBy({ left: px, behavior: 'smooth' });

  /* -------- fetch -------- */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('http://localhost:5000/api/popular-cities');
        if (!res.ok) throw new Error('Network response was not ok');
        const data = await res.json();
        // фільтруємо міста з 0 помешкань і обмежуємо до 10
        const filteredCities = data
          .filter(city => city.propertyCount > 0)
          .slice(0, 10);
        setCities(filteredCities);
      } catch (e) {
        setError(e.message);
      }
    })();
  }, []);

  /* перерахунок після завантаження списку */
  useEffect(() => updateScrollButtons(), [cities, updateScrollButtons]);

  /* слухаємо прокрутку */
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollButtons, { passive: true });
    return () => el.removeEventListener('scroll', updateScrollButtons);
  }, [updateScrollButtons]);

  if (error)
    return <div className="text-red-500 text-center mt-4">Error: {error}</div>;

  return (
    <div className="p-6 relative">
      <h1 className="text-3xl font-bold mb-6 text-center">Popular cities</h1>

      {/* -------- ліва стрілка -------- */}
      {canScrollLeft && (
        <button
          onClick={() => scrollByPx(-300)}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white rounded-full shadow-md p-2 hover:bg-gray-100 z-10"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {/* -------- права стрілка -------- */}
      {canScrollRight && (
        <button
          onClick={() => scrollByPx(300)}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white rounded-full shadow-md p-2 hover:bg-gray-100 z-10"
        >
          <ChevronRight size={24} />
        </button>
      )}

      {/* -------- горизонтальний скрол -------- */}
      <div
        ref={scrollContainerRef}
        className="flex space-x-4 overflow-x-scroll scrollbar-hide scroll-smooth pb-4"
      >
        {cities.map((city) => (
          <Link
            key={city._id}
            to={`/search?city=${encodeURIComponent(city.name)}`}
            className="min-w-[250px] bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow flex-shrink-0"
          >
            <img
              src={city.imageUrl}
              alt={city.name}
              className="w-full h-48 object-cover rounded-t-lg"
            />
            {/* ---- підписи ---- */}
            <div className="p-4">
              <h2 className="font-semibold text-lg leading-none mb-1">
                {city.name}
              </h2>
              <p className="text-gray-500 text-sm">
                {city.propertyCount.toLocaleString('en-US')} properties
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default PopularCities;