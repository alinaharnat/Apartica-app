// src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import ListPropertyPage from './pages/ListPropertyPage';
import AddPropertyPage from './pages/AddPropertyPage';
import RulesPage from './pages/RulesPage'; // <-- Імпорт нової сторінки
import AuthSuccess from './components/AuthSuccess';
import ProfilePage from './pages/ProfilePage';
import BookingsPage from './pages/BookingsPage';
import PropertyPage from './pages/PropertyPage';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/list-your-property" element={<ListPropertyPage />} />
          <Route path="/add-property" element={<AddPropertyPage />} />
          <Route path="/rules" element={<RulesPage />} />
          <Route path="/auth-success" element={<AuthSuccess />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/bookings" element={<BookingsPage />} />
          <Route path="/properties/:id" element={<PropertyPage />} />
        </Routes>
      </Router>
  </StrictMode>,
)