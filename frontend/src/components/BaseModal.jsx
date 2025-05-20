import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

const BaseModal = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 px-4 py-8">
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-5xl max-h-full overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold z-60"
          aria-label="Close"
          style={{ zIndex: 60 }}
        >
          ×
        </button>
        <div className="pt-12 pb-4 px-4">{children}</div> {/* Додаємо відступ зверху */}
      </div>
    </div>,
    document.getElementById('modal-root')
  );
};

export default BaseModal;