  import React, { useState, useRef, useEffect, useCallback } from 'react';
  import axios from 'axios';
  import Navbar from '../../src/components/Navbar.jsx';
  import Footer from '../../src/components/Footer.jsx'; 
  import { useNavigate } from 'react-router-dom';


  const ProfileField = React.memo(function ProfileField({
    label,
    fieldId,
    description,
    isEditing,
    displayValue,
    editValue,
    error,
    editable,
    type = 'text',
    onEditClick,
    onSave,
    onCancel,
    onInputChange,
    isSubmitting,
    inputRefSetter,
  }) {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault(); 
        onSave(fieldId);
      } else if (e.key === 'Escape') {
        onCancel();
      }
    };

    return (
      <div className="py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="sm:w-1/3">
            <h3 className="text-sm font-medium text-gray-500">{label}</h3>
          </div>
          <div className="sm:w-2/3 w-full">
            {isEditing ? (
              <div className="space-y-2">
                {type === 'select' ? (
                  <select
                    ref={inputRefSetter}
                    value={editValue}
                    onChange={(e) => onInputChange(fieldId, e.target.value)}
                    onKeyDown={handleKeyDown}
                    className={`w-full p-2 border rounded text-base text-gray-900 focus:ring-2 focus:ring-purple-600 ${
                      error ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={isSubmitting}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                ) : (
                  <input
                    ref={inputRefSetter}
                    type={type}
                    value={editValue}
                    onChange={(e) => onInputChange(fieldId, e.target.value)}
                    onKeyDown={handleKeyDown}
                    className={`w-full p-2 border rounded text-base text-gray-900 focus:ring-2 focus:ring-purple-600 ${
                      error ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={isSubmitting}
                  />
                )}
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div className="flex justify-end space-x-2 mt-2">
                  <button
                    onClick={() => onSave(fieldId)}
                    disabled={isSubmitting}
                    className="px-4 py-1 rounded bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-400 transition"
                    type="button"
                  >
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="px-4 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
                    type="button"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center"> {}
                <div>
                  <p className="text-base font-medium text-gray-900">
                    {displayValue}
                  </p>
                  {description && !isEditing && <p className="text-sm text-gray-500 mt-1">{description}</p>}
                </div>
                {editable && (
                  <button
                    onClick={() => onEditClick(fieldId)}
                    className="text-purple-600 font-medium text-sm hover:underline ml-4"
                    type="button"
                  >
                    Edit
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  });

  const ProfilePage = () => {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState({ 
      displayName: '',
      email: '',
      phoneNumber: '',
      gender: '',
      dateOfBirth: '',
    });
    const [tempValues, setTempValues] = useState({
      email: '',
      phoneNumber: '',
      gender: '',
      dateOfBirth: '',
    });

    const [editingField, setEditingField] = useState(null); 
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const fieldRefs = useRef({});
    const navigate = useNavigate();

    useEffect(() => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      if (!storedUser || !token) {
        navigate('/auth?mode=login&redirect=/profile');
        return;
      }

      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("Failed to parse user from localStorage:", error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/auth?mode=login&redirect=/profile');
      }
    }, [navigate]);

    useEffect(() => {
      if (!user) return; 

      let didCancel = false;
      const fetchUserData = async () => {
        setIsLoading(true);
        try {
          const response = await axios.get('/api/user/me', {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          });

          if (!didCancel) {
            const apiUser = response.data;
            const profileDataForDisplay = {
              displayName: apiUser.displayName || apiUser.name || '',
              email: apiUser.email || '',
              phoneNumber: apiUser.phoneNumber || '',
              gender: apiUser.gender || '',
              dateOfBirth: apiUser.dateOfBirth
                ? new Date(apiUser.dateOfBirth).toISOString().split('T')[0]
                : '',
                
            };

            setUserData(profileDataForDisplay);
            setTempValues(profileDataForDisplay);
            
            localStorage.setItem('user', JSON.stringify(apiUser));
          }
        } catch (error) {
          if (!didCancel) {
            console.error('Error fetching user data:', error);
            if (error.response?.status === 401) {
              localStorage.removeItem('user');
              localStorage.removeItem('token');
              navigate('/auth?mode=login&redirect=/profile');
            }
          }
        } finally {
          if (!didCancel) setIsLoading(false);
        }
      };

      fetchUserData();

      return () => {
        didCancel = true; 
      };
    }, [user, navigate]); 

    useEffect(() => {
      if (editingField && fieldRefs.current[editingField]) {
        const inputEl = fieldRefs.current[editingField];
        requestAnimationFrame(() => { 
          inputEl.focus();
          if (inputEl.select && inputEl.type !== 'select-one' && inputEl.type !== 'date') {
          }
        });
      }
    }, [editingField]); 

    const handleEditClick = useCallback((field) => {
      setErrors(prev => ({ ...prev, [field]: null })); 
      setTempValues(prev => ({
          ...prev, 
          [field]: userData[field]
      }));
      setEditingField(field);
    }, [userData]); 

    const handleCancelClick = useCallback(() => {
      setEditingField(null);
      setErrors({}); 
    }, []);

    const handleInputChange = useCallback((field, value) => {
      setTempValues(prev => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: null })); 
      }
    }, [errors]);
    const validateInput = (field, value) => {
      if (field === 'displayName') {
        if (!value || value.trim() === '') return 'Name is required';
        if (value.length < 2 || value.length > 50) return 'Name must be between 2 and 50 characters';
      }
    
      if (field === 'email') {
        if (!value) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
      }
    
      if (field === 'phoneNumber') {
        if (value && !/^\+?[0-9\s\-()]{7,20}$/.test(value)) {
          return 'Please enter a valid phone number';
        }
      }
    
      if (field === 'gender') {
        if (!value) return 'Gender is required';
        if (!['male', 'female', 'other'].includes(value)) {
          return 'Please select a valid gender';
        }
      }
    
      if (field === 'dateOfBirth') {
        if (!value) return 'Date of birth is required';
    
        const date = new Date(value);
        const now = new Date();
        if (isNaN(date.getTime())) return 'Invalid date format';
        if (date > now) return 'Date of birth cannot be in the future';
    
        const ageDifMs = now - date;
        const ageDate = new Date(ageDifMs);
        const age = Math.abs(ageDate.getUTCFullYear() - 1970);
    
        if (age < 18) return 'You must be at least 18 years old';
      }
    
      return null;
    };
    

    const handleSaveClick = useCallback(async (field) => {
      if (isSubmitting) return;

      const valueToSave = tempValues[field];
      const error = validateInput(field, valueToSave);
      if (error) {
        setErrors(prev => ({ ...prev, [field]: error }));
        return;
      }

      setIsSubmitting(true);
      try {
        const updatePayload = { [field]: valueToSave };

        if (field === 'dateOfBirth' && valueToSave) {
          updatePayload[field] = new Date(valueToSave).toISOString();
        }

        const response = await axios.patch('/api/user/me', updatePayload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        
        const updatedUserFromApi = response.data;

        setUserData(prev => ({ ...prev, [field]: valueToSave })); 

        localStorage.setItem('user', JSON.stringify(updatedUserFromApi));
        setUser(updatedUserFromApi); 

        setEditingField(null);
        setErrors(prev => ({ ...prev, [field]: null })); 
      } catch (err) {
        console.error('Failed to update user data:', err);
        setErrors(prev => ({
          ...prev,
          [field]: err.response?.data?.message || 'Failed to update. Please try again.',
        }));
      } finally {
        setIsSubmitting(false);
      }
    }, [isSubmitting, tempValues, navigate]);


    const formatDisplayValue = (value, field) => {
      if (value === null || value === undefined || value.toString().trim() === '') {
        return '—';
      }
      if (field === 'dateOfBirth' && value) {
        try {
          const date = new Date(value);
          // Check if date is valid before formatting
          if (isNaN(date.getTime())) return 'Invalid date';
          return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
        } catch {
          return 'Invalid date';
        }
      }
      if (field === 'gender' && value) {
          return value.charAt(0).toUpperCase() + value.slice(1);
      }
      return value;
    };

    if (isLoading || (!user && !localStorage.getItem('token'))) { 
      return (
        <>
          <Navbar user={user} />
          <div className="min-h-screen pt-28 flex items-center justify-center bg-gray-50">
            <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl w-full mx-4">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">My Profile</h2>
              <div className="animate-pulse space-y-6"> {}
                {[...Array(5)].map((_, i) => ( 
                  <div key={i} className="flex justify-between">
                      <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <Footer />
        </>
      );
    }

    const fieldsConfig = [
      { id: 'displayName', label: 'Name', description: 'Your name as it will be displayed on your profile.', editable: true, type: 'text' },
      { id: 'email', label: 'Email', description: 'Your email address (cannot be changed).', editable: false, type: 'email' },
      { id: 'dateOfBirth', label: 'Date of Birth', editable: true, type: 'date' },
      { id: 'phoneNumber', label: 'Phone Number', editable: true, type: 'tel' },
      { id: 'gender', label: 'Gender', editable: true, type: 'select' },
    ];

    return (
      <>
        <Navbar user={user} />
        <div className="min-h-screen pt-20 pb-20 md:pt-28 flex items-start md:items-center justify-center bg-gray-50 px-4">
          <div className="bg-white p-6 md:p-8 rounded-lg shadow-xl max-w-4xl w-full my-8"> {}
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-6 md:mb-8">My Profile</h2>
            <div className="divide-y divide-gray-200">
              {fieldsConfig.map(config => (
                <ProfileField
                  key={config.id}
                  label={config.label}
                  fieldId={config.id}
                  description={config.description}
                  editable={config.editable}
                  type={config.type}
                  isEditing={editingField === config.id}
                  displayValue={formatDisplayValue(userData[config.id], config.id)}
                  editValue={tempValues[config.id]}
                  error={errors[config.id]}
                  onEditClick={handleEditClick}
                  onSave={handleSaveClick}
                  onCancel={handleCancelClick}
                  onInputChange={handleInputChange}
                  isSubmitting={isSubmitting}
                  inputRefSetter={el => (fieldRefs.current[config.id] = el)}
                />
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  };

  export default ProfilePage;