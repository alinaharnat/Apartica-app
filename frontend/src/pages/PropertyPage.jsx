import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
{/*import GalleryModal from '../components/GalleryModal';*/}

const fallbackImage = '../../public/fallback.jpg';

const PropertyPage = () => {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

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

  if (loading) return <div className="p-4 text-center">Loading...</div>;
  if (!property) return <div className="p-4 text-center">Property not found.</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Заголовок */}
      <div>
        <h1 className="text-3xl font-bold mb-2">{property.title}</h1>
        <p className="text-gray-600">
          {property.address}, {property.city?.name}, {property.city?.country?.name}
        </p>
      </div>

      {/* Фото нерухомості */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {property.photos?.slice(0, 8).map((photo, idx) => (
          <div
            key={photo.url}
            className="relative cursor-pointer"
            onClick={() => {
              setSelectedPhotoIndex(idx);
              setIsGalleryOpen(true);
            }}
          >
            <img
              src={photo.url || fallbackImage}
              alt={photo.description || `Photo ${idx + 1}`}
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

      {/* Опис */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Description</h2>
        <p className="text-gray-700">{property.description}</p>
      </div>

      {/* Тип, зручності, правила */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Type</h3>
          <span className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
            {property.propertyType?.name}
          </span>
        </div>

        <div>
          <h3 className="text-lg font-medium">Amenities</h3>
          <div className="flex flex-wrap gap-2">
            {property.amenities?.length > 0 ? (
              property.amenities.map((amenity) => (
                <span key={amenity._id} className="inline-block bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
                  {amenity.name}
                </span>
              ))
            ) : (
              <span className="text-gray-500 text-sm">No amenities listed</span>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium">House Rules</h3>
          <div className="flex flex-wrap gap-2">
            {property.rules?.length > 0 ? (
              property.rules.map((rule) => (
                <span key={rule._id} className="inline-block bg-red-100 text-red-800 text-sm px-3 py-1 rounded-full">
                  {rule.name}
                </span>
              ))
            ) : (
              <span className="text-gray-500 text-sm">No rules listed</span>
            )}
          </div>
        </div>
      </div>

      {/* Кімнати */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Rooms</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {property.rooms?.length > 0 ? (
            property.rooms.map((room) => (
              <div key={room._id} className="border rounded-lg p-4 shadow-sm bg-white">
                <h3 className="font-bold mb-2">Room #{room._id.slice(-4)}</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li><strong>Bedrooms:</strong> {room.bedrooms}</li>
                  <li><strong>Bathrooms:</strong> {room.bathrooms}</li>
                  <li><strong>Max Guests:</strong> {room.maxGuests}</li>
                  <li><strong>Price Per Night:</strong> ${room.pricePerNight}</li>
                </ul>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  {(room.photos?.length > 0 ? room.photos : [null]).map((photo, idx) => (
                    <img
                      key={idx}
                      src={photo?.url || fallbackImage}
                      alt={photo?.filename || 'Fallback'}
                      className="rounded w-full h-32 object-cover"
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm">No rooms found</p>
          )}
        </div>
      </div>

      {/* Модалка галереї */}
      <GalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        photos={property.photos}
        startIndex={selectedPhotoIndex}
      />
    </div>
  );
};

export default PropertyPage;