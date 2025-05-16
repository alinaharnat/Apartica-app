import { useEffect, useState } from 'react';

function PopularCities() {
  const [cities, setCities] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/popular-cities');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setCities(data);
      } catch (error) {
        setError(error.message);
      }
    };

    fetchCities();
  }, []);

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>Популярні міста</h1>
      <ul>
        {cities.map(city => (
          <li key={city._id}>
            <img src={city.imageUrl} alt={city.name} />
            <h2>{city.name}</h2>
            <p>Країна: {city.country}</p>
            <p>Кількість об'єктів: {city.propertyCount}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PopularCities;
