import React, { useState, useEffect } from 'react';
import BaseModal from './BaseModal';

const GalleryModal = ({ photos = [], isOpen, onClose, startIndex = 0 }) => {
  const [current, setCurrent] = useState(startIndex);

  useEffect(() => {
    if (isOpen) setCurrent(startIndex);
  }, [isOpen, startIndex]);

  const next = () => setCurrent((prev) => (prev + 1) % photos.length);
  const prev = () => setCurrent((prev) => (prev - 1 + photos.length) % photos.length);

  if (!isOpen || photos.length === 0) return null;

  return (
    <BaseModal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-5xl mx-auto">
        <div className="relative flex items-center justify-center">
          <button
            onClick={prev}
            className="absolute left-0 text-3xl px-3 text-gray-700 hover:text-purple-600"
            aria-label="Previous"
          >
            &#8592;
          </button>

          <img
            src={photos[current].url}
            alt={photos[current].description || 'Photo'}
            className="max-h-[65vh] mx-auto object-contain rounded"
          />

          <button
            onClick={next}
            className="absolute right-0 text-3xl px-3 text-gray-700 hover:text-purple-600"
            aria-label="Next"
          >
            &#8594;
          </button>
        </div>

        <div className="flex overflow-x-auto gap-2 mt-4 px-2 pb-1">
          {photos.map((p, i) => (
            <img
              key={p._id || i}
              src={p.url}
              alt={p.description || 'thumb'}
              onClick={() => setCurrent(i)}
              className={`h-20 w-28 object-cover cursor-pointer rounded-md border-2 shrink-0 ${
                i === current ? 'border-purple-500' : 'border-transparent'
              }`}
            />
          ))}
        </div>
      </div>
    </BaseModal>
  );
};

export default GalleryModal;
