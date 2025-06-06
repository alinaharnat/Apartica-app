import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { PlusCircleIcon } from '@heroicons/react/24/outline';
import { HomeModernIcon as BedIcon } from '@heroicons/react/24/outline';
import { ArrowUpTrayIcon as UploadIcon } from '@heroicons/react/24/outline';
import { Autocomplete } from '@react-google-maps/api';

const AddPropertyPage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        country: '',
        city: '',
        address: '',
        latitude: null,
        longitude: null,
        amenities: [],
        propertyType: '',
        rooms: [{ id: Date.now(), bedroomCount: 1, bathroomCount: 1, maxGuests: 2, pricePerNight: 100, roomPhotos: [] }],
        houseRules: [],
        cancellationPolicy: 'default',
        photos: [],
    });
    const [previewPhotos, setPreviewPhotos] = useState([]);
    const [roomPreviewPhotos, setRoomPreviewPhotos] = useState({});
    const [useCustomCancellation, setUseCustomCancellation] = useState(false);
    const [cancellationRules, setCancellationRules] = useState([
        { daysBeforeCheckIn: 14, refundPercentage: 100 },
        { daysBeforeCheckIn: 7, refundPercentage: 50 },
        { daysBeforeCheckIn: 0, refundPercentage: 0 },
    ]);
    const [formDataLoaded, setFormDataLoaded] = useState(false);
    const [amenities, setAmenities] = useState([]);
    const [propertyTypes, setPropertyTypes] = useState([]);
    const [houseRulesList, setHouseRulesList] = useState([]);

    const autocompleteRef = useRef(null);

    const defaultCancellationPolicies = [
        {
            id: 'default',
            label: '100% refund if cancelled 14 days before check-in, 50% if cancelled between 14 and 7 days, 0% if cancelled less than 7 days',
            rules: [
                { daysBeforeCheckIn: 14, refundPercentage: 100 },
                { daysBeforeCheckIn: 7, refundPercentage: 50 },
                { daysBeforeCheckIn: 0, refundPercentage: 0 },
            ],
        },
    ];

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found, user is not authenticated');
            alert('Please log in to create a property');
            navigate('/login'); // Перенаправлення на сторінку логіну
            return;
        }

        if (storedUser && token) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (error) {
                console.error('Failed to parse user from localStorage on AddPropertyPage:', error);
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                navigate('/auth?mode=login&redirect=/add-property');
            }
        } else {
            navigate('/auth?mode=login&redirect=/add-property');
        }

        const fetchFormData = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('/api/properties/form-data', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
                setAmenities(response.data.amenities);
                setPropertyTypes(response.data.propertyTypes);
                setHouseRulesList(response.data.houseRules);
                setFormDataLoaded(true);
            } catch (error) {
                console.error('Failed to fetch form data:', error.response?.data || error.message);
                alert(`Failed to load form data: ${error.response?.data?.error || error.message}`);
            }
        };
        fetchFormData();
    }, [navigate]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name === "amenities") {
            setFormData(prev => ({
                ...prev,
                amenities: checked
                  ? [...prev.amenities, value]
                  : prev.amenities.filter(amenity => amenity !== value)
            }));
        } else if (type === "radio") {
            const category = houseRulesList.find(cat => cat.category === name);
            const optionsInCategory = category.options.map(opt => opt.id);
            setFormData(prev => ({
                ...prev,
                houseRules: [
                    ...prev.houseRules.filter(rule => !optionsInCategory.includes(rule)),
                    value,
                ],
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        if (files.length + formData.photos.length > 20) {
            alert("You can upload a maximum of 20 photos.");
            e.target.value = null;
            return;
        }

        const newPhotos = [];
        const newPreviews = [];
        files.forEach(file => {
            if (file.size > 10 * 1024 * 1024) {
                alert(`File ${file.name} is too large (max 10MB).`);
                return;
            }
            newPhotos.push(file);
            newPreviews.push(URL.createObjectURL(file));
        });

        if (newPhotos.length > 0) {
            setFormData(prev => ({ ...prev, photos: [...prev.photos, ...newPhotos] }));
            setPreviewPhotos(prev => [...prev, ...newPreviews]);
        }
        e.target.value = null;
    };

    const handleRoomFileChange = (e, roomId) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const currentRoomPhotos = formData.rooms.find(room => room.id === roomId)?.roomPhotos || [];
        if (files.length + currentRoomPhotos.length > 10) {
            alert("You can upload a maximum of 10 photos per room.");
            e.target.value = null;
            return;
        }

        const newPhotos = [];
        const newPreviews = [];
        files.forEach(file => {
            if (file.size > 10 * 1024 * 1024) {
                alert(`File ${file.name} is too large (max 10MB).`);
                return;
            }
            newPhotos.push(file);
            newPreviews.push(URL.createObjectURL(file));
        });

        if (newPhotos.length > 0) {
            setFormData(prev => ({
                ...prev,
                rooms: prev.rooms.map(room =>
                  room.id === roomId
                    ? { ...room, roomPhotos: [...room.roomPhotos, ...newPhotos] }
                    : room
                ),
            }));
            setRoomPreviewPhotos(prev => ({
                ...prev,
                [roomId]: [...(prev[roomId] || []), ...newPreviews],
            }));
        }
        e.target.value = null;
    };

    const removePhoto = (indexToRemove) => {
        const photoUrlToRevoke = previewPhotos[indexToRemove];
        URL.revokeObjectURL(photoUrlToRevoke);

        setFormData(prev => ({
            ...prev,
            photos: prev.photos.filter((_, index) => index !== indexToRemove),
        }));
        setPreviewPhotos(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const removeRoomPhoto = (roomId, indexToRemove) => {
        const photoUrlToRevoke = roomPreviewPhotos[roomId][indexToRemove];
        URL.revokeObjectURL(photoUrlToRevoke);

        setFormData(prev => ({
            ...prev,
            rooms: prev.rooms.map(room =>
              room.id === roomId
                ? { ...room, roomPhotos: room.roomPhotos.filter((_, index) => index !== indexToRemove) }
                : room
            ),
        }));
        setRoomPreviewPhotos(prev => ({
            ...prev,
            [roomId]: prev[roomId].filter((_, index) => index !== indexToRemove),
        }));
    };

    const addDynamicField = (field) => {
        setFormData(prev => ({
            ...prev,
            [field]: [...prev[field], { id: Date.now() + prev[field].length, bedroomCount: 1, bathroomCount: 1, maxGuests: 2, pricePerNight: 100, roomPhotos: [] }],
        }));
    };

    const removeDynamicField = (field, idToRemove) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].filter(item => item.id !== idToRemove),
        }));
        setRoomPreviewPhotos(prev => {
            const newPreviews = { ...prev };
            delete newPreviews[idToRemove];
            return newPreviews;
        });
    };

    const handleDynamicFieldChange = (field, id, key, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].map(item =>
              item.id === id
                ? {
                    ...item,
                    [key]: key === 'pricePerNight'
                      ? parseFloat(value) || 0 // Дозволяємо дробові значення для ціни, мінімальне 0
                      : Math.max(1, parseInt(value) || 1), // Зберігаємо логіку для інших полів
                }
                : item
            ),
        }));
    };

    const addCancellationRule = () => {
        setCancellationRules([...cancellationRules, { daysBeforeCheckIn: 0, refundPercentage: 0 }]);
    };

    const updateCancellationRule = (index, field, value) => {
        const updatedRules = cancellationRules.map((rule, i) =>
          i === index ? { ...rule, [field]: parseInt(value) || 0 } : rule
        );
        setCancellationRules(updatedRules);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.photos.length < 1 || formData.photos.length > 20) {
            alert('Please add at least 1 photo and no more than 20 for the property.');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found, user is not authenticated');
            alert('Please log in to create a property');
            navigate('/login');
            return;
        }

        const headers = {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
        };

        const dataToSubmit = new FormData();
        dataToSubmit.append('title', formData.title);
        dataToSubmit.append('description', formData.description);
        dataToSubmit.append('address', formData.address);
        dataToSubmit.append('country', formData.country);
        dataToSubmit.append('city', formData.city);
        dataToSubmit.append('location[latitude]', formData.latitude);
        dataToSubmit.append('location[longitude]', formData.longitude);

        Object.keys(formData).forEach(key => {
            if (key === 'photos') {
                formData.photos.forEach(photoFile => {
                    dataToSubmit.append('photos', photoFile, photoFile.name);
                });
            } else if (key === 'rooms') {
                formData.rooms.forEach((room, index) => {
                    room.roomPhotos.forEach(photoFile => {
                        dataToSubmit.append(`room_photos`, photoFile, `${index}_${photoFile.name}`);
                    });
                });
                dataToSubmit.append('rooms', JSON.stringify(
                  formData.rooms.map(room => ({
                      numBedrooms: room.bedroomCount,
                      numBathrooms: room.bathroomCount,
                      maxGuests: room.maxGuests,
                      pricePerNight: room.pricePerNight,
                  }))
                ));
            } else if (key === 'cancellationPolicy' && useCustomCancellation) {
                dataToSubmit.append('cancellationPolicy', JSON.stringify({
                    rules: cancellationRules,
                    isCustom: true,
                }));
            } else if (key === 'cancellationPolicy') {
                const selectedPolicy = defaultCancellationPolicies.find(policy => policy.id === formData.cancellationPolicy);
                dataToSubmit.append('cancellationPolicy', JSON.stringify({
                    rules: selectedPolicy.rules.map(rule => ({
                        ...rule,
                        refundPercentage: Number(rule.refundPercentage), // Залишаємо як число
                    })),
                    isCustom: false,
                    name: selectedPolicy.label,
                }));
            } else if (key === 'amenities' || key === 'houseRules') {
                dataToSubmit.append(key, JSON.stringify(formData[key]));
            } else if (key !== 'title' && key !== 'description' && key !== 'address' && key !== 'country' && key !== 'city' && key !== 'latitude' && key !== 'longitude') {
                dataToSubmit.append(key, formData[key]);
            }
        });

        try {
            const response = await axios.post('/api/properties', dataToSubmit, { headers });
            navigate(`/properties/${response.data.data.property._id}`);
        } catch (error) {
            console.error('Submit error:', error.response?.data || error);
        }
    };

    useEffect(() => {
        return () => {
            previewPhotos.forEach(fileUrl => URL.revokeObjectURL(fileUrl));
            Object.values(roomPreviewPhotos).flat().forEach(fileUrl => URL.revokeObjectURL(fileUrl));
        };
    }, [previewPhotos, roomPreviewPhotos]);

    if (!formDataLoaded) return <div>Loading form data...</div>;

    const handlePlaceSelect = () => {
        if (autocompleteRef.current) {
            const place = autocompleteRef.current.getPlace();
            if (!place.geometry) {
                alert('Please select a valid address from the suggestions.');
                return;
            }

            let country = '';
            let city = '';
            let address = place.formatted_address || '';

            place.address_components.forEach(component => {
                if (component.types.includes('country')) {
                    country = component.long_name;
                }
                if (component.types.includes('locality') && !city) {
                    city = component.long_name;
                } else if (component.types.includes('administrative_area_level_2') && !city) {
                    city = component.long_name;
                } else if (component.types.includes('administrative_area_level_1') && !city) {
                    city = component.long_name;
                }
            });

            const latitude = place.geometry.location.lat();
            const longitude = place.geometry.location.lng();

            setFormData(prev => ({
                ...prev,
                country,
                city,
                address,
                latitude,
                longitude,
            }));
        }
    };

    return (
      <div className="min-h-screen flex flex-col bg-[#F9F5F2] text-gray-700">
          <Navbar user={user} />
          <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-3">
                  List your property on Apartica
              </h1>
              <p className="text-lg text-gray-500 mb-10">
                  ...and start welcoming guests in no time!
              </p>

              <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Headline & Description */}
                  <div className="p-6 bg-white rounded-lg shadow-lg">
                      <div className="mb-6">
                          <label htmlFor="headline" className="block text-xl font-semibold text-gray-800 mb-1">Headline</label>
                          <p className="text-sm text-gray-500 mb-2">This will be the biggest label that will show up in searches and on the page of your listing.</p>
                          <input
                            type="text"
                            name="title"
                            id="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                            placeholder="e.g., Cozy Downtown Apartment with Stunning Views"
                            required
                            maxLength="100"
                          />
                      </div>
                      <div>
                          <label htmlFor="description" className="block text-xl font-semibold text-gray-800 mb-1">Description</label>
                          <p className="text-sm text-gray-500 mb-2">To help guests to understand what their stay will be like better.</p>
                          <textarea
                            name="description"
                            id="description"
                            rows="5"
                            value={formData.description}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                            placeholder="Describe your property, its unique features, the neighborhood, and what makes it special for guests..."
                            required
                          ></textarea>
                      </div>
                  </div>

                  {/* Location */}
                  <div className="p-6 bg-white rounded-lg shadow-lg">
                      <h2 className="text-xl font-semibold text-gray-800 mb-4">Location</h2>
                      <div className="mb-4">
                          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Search for your property address</label>
                          <p className="text-xs text-gray-500 mb-2">Start typing your address, and select the correct option from the suggestions.</p>
                          <Autocomplete
                            onLoad={(autocomplete) => {
                                autocompleteRef.current = autocomplete;
                            }}
                            onPlaceChanged={handlePlaceSelect}
                            options={{
                                types: ['address'],
                                language: 'en',
                                region: 'us',
                            }}
                          >
                              <input
                                type="text"
                                id="location"
                                name="location"
                                placeholder="e.g., 123 Main St, Dublin, Ireland"
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm py-2.5 px-3.5"
                                required
                                onFocus={(e) => (e.target.value = '')}
                              />
                          </Autocomplete>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                          <div>
                              <label className="block text-sm font-medium text-gray-700">Country</label>
                              <input
                                type="text"
                                value={formData.country || ''}
                                readOnly
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2.5 px-3.5 bg-gray-100 sm:text-sm"
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700">City</label>
                              <input
                                type="text"
                                value={formData.city || ''}
                                readOnly
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2.5 px-3.5 bg-gray-100 sm:text-sm"
                              />
                          </div>
                          <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700">Full Address</label>
                              <input
                                type="text"
                                value={formData.address || ''}
                                readOnly
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2.5 px-3.5 bg-gray-100 sm:text-sm"
                              />
                          </div>
                      </div>
                  </div>

                  {/* Amenities */}
                  <div className="p-6 bg-white rounded-lg shadow-lg">
                      <h2 className="text-xl font-semibold text-gray-800 mb-1">Amenities</h2>
                      <p className="text-xs text-gray-500 mb-4">Choose all the amenities you have at your place. The more amenities, the more likely people are to book!</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3">
                          {amenities.map(amenity => (
                            <div key={amenity._id} className="flex items-center">
                                <input
                                  id={amenity._id}
                                  name="amenities"
                                  type="checkbox"
                                  value={amenity._id}
                                  checked={formData.amenities.includes(amenity._id)}
                                  onChange={handleChange}
                                  className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                                />
                                <label htmlFor={amenity._id} className="ml-2.5 block text-sm text-gray-700 cursor-pointer flex items-center">
                                    {amenity.icon && <img src={amenity.icon} alt={`${amenity.name} icon`} className="w-5 h-5 mr-2" />}
                                    {amenity.name}
                                </label>
                            </div>
                          ))}
                      </div>
                  </div>

                  {/* Property Type, Rooms */}
                  <div className="p-6 bg-white rounded-lg shadow-lg">
                      <h2 className="text-xl font-semibold text-gray-800 mb-4">Property Details</h2>
                      <div className="mb-6">
                          <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700">Property type</label>
                          <select
                            id="propertyType"
                            name="propertyType"
                            value={formData.propertyType}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md shadow-sm"
                          >
                              <option value="">Select property type</option>
                              {propertyTypes.map(type => (
                                <option key={type._id} value={type._id}>{type.name}</option>
                              ))}
                          </select>
                      </div>

                      <h3 className="text-lg font-semibold mt-6 mb-3 text-gray-800">Rooms</h3>
                      <div className="space-y-4">
                          {formData.rooms.map((room, index) => (
                            <div key={room.id} className="mb-4 p-4 border rounded-md bg-gray-50 space-y-3">
                                <div className="flex items-center gap-2">
                                    <BedIcon className="w-5 h-5 text-gray-500 shrink-0" />
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Room {index + 1}</h4>
                                    {formData.rooms.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => removeDynamicField('rooms', room.id)}
                                        className="text-red-500 hover:text-red-700 text-xs p-1"
                                      >
                                          Remove
                                      </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Bedrooms</label>
                                        <input
                                          type="number"
                                          min="1"
                                          value={room.bedroomCount}
                                          onChange={(e) => handleDynamicFieldChange('rooms', room.id, 'bedroomCount', e.target.value)}
                                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-1.5 px-2.5 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Bathrooms</label>
                                        <input
                                          type="number"
                                          min="1"
                                          value={room.bathroomCount}
                                          onChange={(e) => handleDynamicFieldChange('rooms', room.id, 'bathroomCount', e.target.value)}
                                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-1.5 px-2.5 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Max Guests</label>
                                        <input
                                          type="number"
                                          min="1"
                                          value={room.maxGuests}
                                          onChange={(e) => handleDynamicFieldChange('rooms', room.id, 'maxGuests', e.target.value)}
                                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-1.5 px-2.5 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Price per Night (€)</label>
                                        <input
                                          type="number"
                                          min="0"
                                          step="0.01" // Дозволяємо дробові значення (наприклад, 100.50)
                                          value={room.pricePerNight}
                                          onChange={(e) => handleDynamicFieldChange('rooms', room.id, 'pricePerNight', Number(e.target.value))}
                                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-1.5 px-2.5 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Room Photos</label>
                                    <div className="mt-1">
                                        <label
                                          htmlFor={`room-file-upload-${room.id}`}
                                          className="flex justify-center w-full h-24 px-4 pt-3 pb-4 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-purple-400 transition-colors"
                                        >
                                            <div className="space-y-1 text-center">
                                                <UploadIcon className="mx-auto h-6 w-6 text-gray-400" />
                                                <div className="flex text-xs text-gray-600">
                            <span className="font-medium text-purple-600 hover:text-purple-500">
                              Upload files
                            </span>
                                                    <p className="pl-1">or drag and drop</p>
                                                </div>
                                                <p className="text-xs text-gray-500">PNG, JPG, JPEG up to 10MB each</p>
                                            </div>
                                            <input
                                              id={`room-file-upload-${room.id}`}
                                              name={`room-file-upload-${room.id}`}
                                              type="file"
                                              className="sr-only"
                                              multiple
                                              onChange={(e) => handleRoomFileChange(e, room.id)}
                                              accept="image/png, image/jpeg, image/jpg"
                                            />
                                        </label>
                                    </div>
                                    {roomPreviewPhotos[room.id]?.length > 0 && (
                                      <div className="mt-4">
                                          <p className="text-sm font-medium text-gray-700 mb-2">Uploaded room photos ({roomPreviewPhotos[room.id].length}/10):</p>
                                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                              {roomPreviewPhotos[room.id].map((src, index) => (
                                                <div key={index} className="relative group aspect-square">
                                                    <img src={src} alt={`Room ${index + 1} Preview ${index + 1}`} className="h-full w-full object-cover rounded-md shadow" />
                                                    <button
                                                      type="button"
                                                      onClick={() => removeRoomPhoto(room.id, index)}
                                                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-0.5 w-5 h-5 flex items-center justify-center text-xs leading-none opacity-0 group-hover:opacity-100 hover:bg-red-700 transition-opacity focus:outline-none"
                                                      title="Remove photo"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                              ))}
                                          </div>
                                      </div>
                                    )}
                                </div>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addDynamicField('rooms')}
                            className="mt-1 text-sm text-purple-600 hover:text-purple-800 font-medium flex items-center py-1"
                          >
                              <PlusCircleIcon className="w-5 h-5 mr-1" /> Add room
                          </button>
                      </div>
                  </div>

                  {/* House Rules */}
                  <div className="p-6 bg-white rounded-lg shadow-lg">
                      <h2 className="text-xl font-semibold text-gray-800 mb-1">House Rules</h2>
                      <p className="text-xs text-gray-500 mb-4">Set the rules for your property to ensure guests know what to expect.</p>
                      <div className="space-y-6">
                          {houseRulesList && houseRulesList.length > 0 ? (
                            houseRulesList.map(category => (
                              <div key={category.category}>
                                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{category.category}</h3>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
                                      {category.options.map(option => (
                                        <div key={option.id} className="flex items-center">
                                            <input
                                              type="radio"
                                              id={option.id}
                                              name={category.category}
                                              value={option.id}
                                              checked={formData.houseRules.includes(option.id)}
                                              onChange={handleChange}
                                              className="h-4 w-4 text-purple-600 border-gray-300 focus:ring-purple-500 cursor-pointer"
                                            />
                                            <label htmlFor={option.id} className="ml-2.5 block text-sm text-gray-700 cursor-pointer">
                                                {option.label}
                                            </label>
                                        </div>
                                      ))}
                                  </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500">No house rules available.</p>
                          )}
                      </div>
                  </div>

                  {/* Cancellation Policy */}
                  <div className="p-6 bg-white rounded-lg shadow-lg">
                      <h2 className="text-xl font-semibold text-gray-800 mb-1">Cancellation Policy</h2>
                      <p className="text-xs text-gray-500 mb-4">Define the cancellation policy for your property.</p>
                      <div className="flex items-center mb-4">
                          <input
                            type="checkbox"
                            checked={useCustomCancellation}
                            onChange={(e) => setUseCustomCancellation(e.target.checked)}
                            className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                          />
                          <label className="ml-2 text-sm text-gray-700">Set custom cancellation policy</label>
                      </div>
                      {useCustomCancellation ? (
                        <div className="space-y-3">
                            {cancellationRules.map((rule, index) => (
                              <div key={index} className="flex items-center gap-4">
                                  <div>
                                      <label className="block text-sm font-medium text-gray-700">Days before check-in</label>
                                      <input
                                        type="number"
                                        value={rule.daysBeforeCheckIn}
                                        onChange={(e) => updateCancellationRule(index, 'daysBeforeCheckIn', e.target.value)}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-1.5 px-2.5 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-sm font-medium text-gray-700">Refund percentage</label>
                                      <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={rule.refundPercentage}
                                        onChange={(e) => updateCancellationRule(index, 'refundPercentage', e.target.value)}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-1.5 px-2.5 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                      />
                                  </div>
                                  {cancellationRules.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => setCancellationRules(cancellationRules.filter((_, i) => i !== index))}
                                      className="text-red-500 hover:text-red-700 text-sm p-1 self-end"
                                    >
                                        Remove
                                    </button>
                                  )}
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={addCancellationRule}
                              className="mt-2 text-sm text-purple-600 hover:text-purple-800 font-medium flex items-center py-1"
                            >
                                <PlusCircleIcon className="w-5 h-5 mr-1" /> Add rule
                            </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-y-3">
                            {defaultCancellationPolicies.map(policy => (
                              <div key={policy.id} className="flex items-center">
                                  <input
                                    type="radio"
                                    id={policy.id}
                                    name="cancellationPolicy"
                                    value={policy.id}
                                    checked={formData.cancellationPolicy === policy.id}
                                    onChange={handleChange}
                                    className="h-4 w-4 text-purple-600 border-gray-300 focus:ring-purple-500 cursor-pointer"
                                  />
                                  <label htmlFor={policy.id} className="ml-2.5 block text-sm text-gray-700 cursor-pointer">
                                      {policy.label.replace(/(\d+)%/g, '$1% refund')}
                                  </label>
                              </div>
                            ))}
                        </div>
                      )}
                  </div>

                  {/* Photos */}
                  <div className="p-6 bg-white rounded-lg shadow-lg">
                      <h2 className="text-xl font-semibold text-gray-800 mb-1">Property Photos</h2>
                      <p className="text-xs text-gray-500 mb-4">Add 1-20 photos of your property. Show all the details so renters know what to expect. Recommended size: 1024x1024 pixels, max 10MB each.</p>
                      <div className="mt-1">
                          <label
                            htmlFor="file-upload"
                            className="flex justify-center w-full h-32 px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-purple-400 transition-colors"
                          >
                              <div className="space-y-1 text-center">
                                  <UploadIcon className="mx-auto h-10 w-10 text-gray-400" />
                                  <div className="flex text-sm text-gray-600">
                    <span className="font-medium text-purple-600 hover:text-purple-500">
                      Upload files
                    </span>
                                      <p className="pl-1">or drag and drop</p>
                                  </div>
                                  <p className="text-xs text-gray-500">PNG, JPG, JPEG up to 10MB each</p>
                              </div>
                              <input
                                id="file-upload"
                                name="file-upload"
                                type="file"
                                className="sr-only"
                                multiple
                                onChange={handleFileChange}
                                accept="image/png, image/jpeg, image/jpg"
                              />
                          </label>
                      </div>
                      {previewPhotos.length > 0 && (
                        <div className="mt-6">
                            <p className="text-sm font-medium text-gray-700 mb-2">Uploaded photos ({previewPhotos.length}/20):</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {previewPhotos.map((src, index) => (
                                  <div key={index} className="relative group aspect-square">
                                      <img src={src} alt={`Preview ${index + 1}`} className="h-full w-full object-cover rounded-md shadow" />
                                      <button
                                        type="button"
                                        onClick={() => removePhoto(index)}
                                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-0.5 w-5 h-5 flex items-center justify-center text-xs leading-none opacity-0 group-hover:opacity-100 hover:bg-red-700 transition-opacity focus:outline-none"
                                        title="Remove photo"
                                      >
                                          ✕
                                      </button>
                                  </div>
                                ))}
                            </div>
                        </div>
                      )}
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end pt-6 border-t border-gray-200 mt-8">
                      <button
                        type="submit"
                        className="bg-[#8252A1] hover:bg-purple-700 text-white font-semibold py-3 px-10 rounded-lg shadow-md hover:shadow-lg transition duration-300 text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
                      >
                          Add new property
                      </button>
                  </div>
              </form>
          </main>
          <Footer />
      </div>
    );
};

export default AddPropertyPage;