import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import GalleryModal from '../components/GalleryModal';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { LoadScript, GoogleMap, Marker } from '@react-google-maps/api';
import BaseModal from '../components/BaseModal';


const fallbackImage = '../../public/fallback.jpg';

const PropertyPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() + 7))
  );
  const [endDate, setEndDate] = useState(
    new Date(new Date().setDate(new Date().getDate() + 8))
  );
  const [guests, setGuests] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState('');
  const [modalPhotos, setModalPhotos] = useState([]);

  // Отримання API-ключа з бекенду
  useEffect(() => {
    const fetchGoogleMapsKey = async () => {
      try {
        const { data } = await axios.get('/api/config/google-maps-key');
        setGoogleMapsApiKey(data.key);
      } catch (err) {
        console.error('Failed to fetch Google Maps API key', err);
      }
    };
    fetchGoogleMapsKey();
  }, []);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const { data } = await axios.get(`/api/properties/${id}`);
        setProperty(data);
      } catch (err) {
        console.error('Failed to fetch property', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  useEffect(() => {
    const fetchAvailableRooms = async () => {
      const response = await axios.get(`/api/properties/${id}/available-rooms`, {
        params: { startDate: startDate.toISOString(), endDate: endDate.toISOString(), guests },
      });
      setAvailableRooms(response.data);
      if (response.data.length) {
        const cheapestRoom = response.data.reduce((min, room) =>
          room.pricePerNight < min.pricePerNight ? room : min
        );
        const nights = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        setTotalPrice(cheapestRoom.pricePerNight * nights);
      } else {
        setTotalPrice(0);
      }
    };
    fetchAvailableRooms();
  }, [id, startDate, endDate, guests]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  const handleReserve = () => {
    navigate('/booking', { state: { startDate, endDate, guests, totalPrice, propertyId: id } });
  };

  if (loading) return <div className="p-4 text-center">Loading...</div>;
  if (!property || !googleMapsApiKey) return <div className="p-4 text-center">Property or API key not found.</div>;

  const mapContainerStyle = { width: '300px', height: '200px' };
  const center = property.location && property.location.latitude && property.location.longitude
    ? { lat: property.location.latitude, lng: property.location.longitude }
    : { lat: 0, lng: 0 };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Заголовок та кнопка Share */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">{property.title}</h1>
          <p className="text-gray-600">
            {property.address}, {property.city?.name}, {property.city?.country?.name}
          </p>
        </div>
        <button
          onClick={handleShare}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
        >
          Share
        </button>
      </div>

      {/* Фото нерухомості */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {property.photos?.slice(0, 8).map((photo, idx) => (
          <div
            key={photo.url}
            className="relative cursor-pointer"
            onClick={() => {
              setModalPhotos(property.photos); // Встановлюємо фото помешкання
              setSelectedPhotoIndex(idx);
              setIsGalleryOpen(true);
            }}
          >
            <img
              src={photo.url || fallbackImage}
              alt={photo.filename || `Photo ${idx + 1}`}
              className="rounded-lg w-full h-48 object-cover"
            />
            {idx === 7 && property.photos.length > 8 && (
              <div className="absolute inset-0 bg-black bg-opacity-50 text-white flex items-center justify-center text-lg font-medium rounded-lg">
                +{property.photos.length - 8} more
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Блок бронювання */}
      <div className="sticky top-20 bg-white p-4 border rounded-lg shadow-md w-80">
        <h3 className="text-xl font-semibold mb-2">€{totalPrice}</h3>
        <DatePicker
          selected={startDate}
          onChange={date => setStartDate(date)}
          selectsStart
          startDate={startDate}
          endDate={endDate}
          className="w-full p-2 border rounded mb-2"
          placeholderText="Check-in"
        />
        <DatePicker
          selected={endDate}
          onChange={date => setEndDate(date)}
          selectsEnd
          startDate={startDate}
          endDate={endDate}
          minDate={startDate}
          className="w-full p-2 border rounded mb-2"
          placeholderText="Check-out"
        />
        <input
          type="number"
          value={guests}
          onChange={e => setGuests(parseInt(e.target.value) || 1)}
          min="1"
          className="w-full p-2 border rounded mb-2"
          placeholder="Guests"
        />
        <button
          onClick={handleReserve}
          className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
        >
          Reserve
        </button>
      </div>

      {/* Карта */}
      <LoadScript googleMapsApiKey={googleMapsApiKey}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle} // Тепер використовуємо константу
          center={center}
          zoom={15}
          onClick={() => setIsMapOpen(true)}
        >
          <Marker position={center} />
        </GoogleMap>
      </LoadScript>

      <BaseModal isOpen={isMapOpen} onClose={() => setIsMapOpen(false)}>
        <LoadScript googleMapsApiKey={googleMapsApiKey}>
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '500px' }} // Використовуємо інлайн-стиль для модального вікна
            center={center}
            zoom={15}
          >
            <Marker position={center} />
          </GoogleMap>
        </LoadScript>
        <button
          onClick={() => setIsMapOpen(false)}
          className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
        >
          Close
        </button>
      </BaseModal>

      {/* Інформація */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Information</h2>
        <div className="flex flex-wrap gap-2">
          {property.amenities?.map(amenity => (
            <span key={amenity._id} className="flex items-center bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full gap-2">
              {amenity.name}
            </span>
          ))}
        </div>
      </div>

      {/* Опис та рейтинг */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Description</h2>
        <p className="text-gray-700">{property.description}</p>
        <div className="mt-2">
          <h3 className="text-lg font-medium">Average Rating: {property.averageRating.toFixed(1)}</h3>
        </div>
      </div>

      {/* Кімнати */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Available Room Types</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {availableRooms.map(room => (
            <div key={room._id} className="border rounded-lg p-4 shadow-sm bg-white flex items-center gap-4">
              <img
                src={room.photos[0]?.url || fallbackImage}
                alt="Room"
                className="w-32 h-24 object-cover rounded"
                onClick={() => {
                  setModalPhotos(room.photos); // Встановлюємо фото кімнати
                  setSelectedPhotoIndex(0);
                  setIsGalleryOpen(true);
                }}
              />
              <div>
                <p>{room.bedrooms} bedroom(s), {room.bathrooms} bathroom(s)</p>
                <p>👤 x{room.maxGuests}</p>
                <p>€{room.pricePerNight}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Відгуки */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Guest Reviews</h2>
        {property.reviews?.slice(0, 2).map(review => (
          <div key={review._id} className="border-b py-2">
            <p className="font-medium">{review.userDisplayName}</p> {/* Змінено з userId на userDisplayName */}
            <p className="text-gray-700">{review.comment}</p>
            <p>Rating: {review.rating}/10</p>
          </div>
        ))}
        {property.reviews?.length > 2 && (
          <button
            onClick={() => setIsGalleryOpen(true)}
            className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Show all {property.reviews.length} reviews
          </button>
        )}
      </div>

      {/* Правила */}
      <div>
        <h2 className="text-xl font-semibold mb-4">House Rules</h2>
        {property.rules?.map(rule => (
          <div key={rule._id} className="flex items-center gap-2 mb-2">
            <p className="text-gray-700">{rule.category?.name}:</p>
            <span className="bg-red-100 text-red-800 text-sm px-2 py-1 rounded">
              {rule.value}
            </span>
          </div>
        ))}
      </div>

      <GalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        photos={modalPhotos} // Використовуємо modalPhotos
        startIndex={selectedPhotoIndex}
      />
    </div>
  );
};

export default PropertyPage;