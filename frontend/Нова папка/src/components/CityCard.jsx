import React, { useEffect, useState } from 'react';
import axios from 'axios';

function TopCities() {
  const [cities, setCities] = useState([]);

  useEffect(() => {
    axios.get('/api/cities/top') 
      .then(res => setCities(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div style={{
      display: 'flex',
      overflowX: 'auto',
      gap: '1rem',
      padding: '1rem',
    }}>
      {cities.map(city => (
        <div key={city._id} style={{
          minWidth: '150px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          overflow: 'hidden',
          textAlign: 'center',
          backgroundColor: '#fff',
          flexShrink: 0,
          cursor: 'pointer'
        }}>
          <img 
            src={city.imageUrl} 
            alt={city.name} 
            style={{ width: '150px', height: '150px', objectFit: 'cover' }} 
          />
          <div style={{ padding: '0.5rem' }}>
            <h4 style={{ margin: '0.25rem 0' }}>{city.name}</h4>
            <p style={{ color: '#666', fontSize: '0.85rem' }}>
              {city.hotelCount.toLocaleString()} properties
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default TopCities;
