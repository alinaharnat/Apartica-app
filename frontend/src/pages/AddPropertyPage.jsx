import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { LoadScript, Autocomplete as GoogleAutocomplete } from '@react-google-maps/api';
import { PlusCircleIcon, MinusCircleIcon, HomeModernIcon as BedIcon, ArrowUpTrayIcon as UploadIcon, ClockIcon, MapPinIcon } from '@heroicons/react/24/outline';

const LIBRARIES_TO_LOAD = ['places'];

const AddPropertyPage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [googleMapsApiKey, setGoogleMapsApiKey] = useState('');
    const [isMapApiLoaded, setIsMapApiLoaded] = useState(false);

    // Data from DB
    const [amenitiesFromDB, setAmenitiesFromDB] = useState([]);
    const [houseRulesFromDB, setHouseRulesFromDB] = useState([]);
    const [propertyTypesFromDB, setPropertyTypesFromDB] = useState([]);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        country: null,
        city: null,
        address: '',
        latitude: null,
        longitude: null,
        amenityIds: [],
        ruleOptionIds: [],
        propertyTypeName: '',
        propertyPhotos: [],
        rooms: [
            {
                id: Date.now(),
                bedrooms: 1,
                bathrooms: 1,
                maxGuests: 1,
                pricePerNight: 0,
                roomPhotos: [],
                previewRoomPhotos: [],
            }
        ],
        checkInTime: '15:00',
        checkOutTime: '11:00',
    });

    const [currentAddressInput, setCurrentAddressInput] = useState('');
    const [autocompleteInstance, setAutocompleteInstance] = useState(null);
    
    const [addressError, setAddressError] = useState('');
    const [submitError, setSubmitError] = useState('');

    const [previewPropertyPhotos, setPreviewPropertyPhotos] = useState([]);
    
    const [geocodingLoading, setGeocodingLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (storedUser && token) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
            } catch (error) {
                console.error("Failed to parse user from localStorage:", error);
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                navigate('/auth?mode=login&redirect=/add-property');
            }
        } else {
            navigate('/auth?mode=login&redirect=/add-property');
        }

        const fetchGoogleMapsKey = async () => {
          try {
            const { data } = await axios.get('/api/config/google-maps-key');
            if (data.key) {
                setGoogleMapsApiKey(data.key);
            } else {
                throw new Error("API key not found in response");
            }
          } catch (err) {
            console.error('Failed to fetch Google Maps API key:', err);
            setAddressError('Map services are unavailable. Cannot load address suggestions.');
          }
        };
        fetchGoogleMapsKey();
    }, [navigate]);

    // Fetch static data from DB
    useEffect(() => {
        const fetchStaticData = async () => {
            try {
                const [amenitiesRes, rulesRes, typesRes] = await Promise.all([
                    axios.get('/api/static/amenities'),
                    axios.get('/api/static/house-rules'),
                    axios.get('/api/property-types')
                ]);
                
                setAmenitiesFromDB(amenitiesRes.data);
                setHouseRulesFromDB(rulesRes.data);
                setPropertyTypesFromDB(typesRes.data);
            } catch (error) {
                console.error('Error fetching static data:', error);
                setSubmitError('Failed to load form data. Please refresh the page.');
            }
        };
        
        fetchStaticData();
    }, []);

    useEffect(() => {
        return () => {
            previewPropertyPhotos.forEach(fileUrl => URL.revokeObjectURL(fileUrl));
            formData.rooms.forEach(room => {
                room.previewRoomPhotos.forEach(fileUrl => URL.revokeObjectURL(fileUrl));
            });
        };
    }, [previewPropertyPhotos, formData.rooms]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSubmitError('');

        if (['checkInTime', 'checkOutTime'].includes(name)) {
            setFormData(prev => ({ ...prev, [name]: value }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleAmenityChange = (amenityId, checked) => {
        setFormData(prev => ({
            ...prev,
            amenityIds: checked
                ? [...prev.amenityIds, amenityId]
                : prev.amenityIds.filter(id => id !== amenityId)
        }));
    };

    const handleRuleChange = (ruleId, checked) => {
        setFormData(prev => ({
            ...prev,
            ruleOptionIds: checked
                ? [...prev.ruleOptionIds, ruleId]
                : prev.ruleOptionIds.filter(id => id !== ruleId)
        }));
    };

    const onLoadAutocomplete = useCallback((autocomplete) => {
        console.log('Autocomplete loaded');
        setAutocompleteInstance(autocomplete);
    }, []);

    const onPlaceChanged = () => {
        if (autocompleteInstance !== null) {
            const place = autocompleteInstance.getPlace();
            console.log('Place selected:', place);
            if (place && place.formatted_address) {
                const selectedFormattedAddress = place.formatted_address;
                setCurrentAddressInput(selectedFormattedAddress);
                setAddressError('');
                fetchAddressDetails(selectedFormattedAddress);
            } else {
                console.warn('Autocomplete: place not found or no formatted_address.');
            }
        }
    };
    
    const handleAddressInputChange = (e) => {
        const newAddressInput = e.target.value;
        setCurrentAddressInput(newAddressInput);
        setAddressError('');
        if (formData.address && newAddressInput !== formData.address) {
             setFormData(prev => ({
                ...prev, country: null, city: null, address: '', latitude: null, longitude: null,
            }));
        }
    };

    const fetchAddressDetails = async (addressToParseOverride = null) => {
        const addressToParse = addressToParseOverride || currentAddressInput.trim();
        
        console.log('Fetching address details for:', addressToParse);

        if (!addressToParse) {
            setAddressError('Please enter or select an address from suggestions.');
            return;
        }
        
        const token = localStorage.getItem('token');
        if (!token || !user) {
             setAddressError('Authentication required to parse address. Please ensure you are logged in.');
             return;
        }

        setAddressError('');
        setGeocodingLoading(true);
        try {
            const response = await axios.post(
                '/api/geocode/address',
                { address: addressToParse },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log('Geocode response:', response.data);
            const data = response.data;
            setFormData(prev => ({
                ...prev,
                country: data.country,
                city: data.city,
                address: data.formattedAddress,
                latitude: data.latitude,
                longitude: data.longitude,
            }));
            setCurrentAddressInput(data.formattedAddress);
        } catch (error) {
            console.error('Error fetching address details:', error.response ? error.response.data : error.message);
            const message = error.response?.data?.message || 'Could not parse address. Please try a different format or ensure it is a valid location.';
            setAddressError(message);
            setFormData(prev => ({ ...prev, country: null, city: null, address: '', latitude: null, longitude: null }));
        } finally {
            setGeocodingLoading(false);
        }
    };

    const handlePropertyFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        if (files.length + formData.propertyPhotos.length > 6) {
            setSubmitError("You can upload a maximum of 6 property photos.");
            e.target.value = null;
            return;
        }
        setSubmitError('');

        const newPhotos = [];
        const newPreviews = [];

        files.forEach(file => {
            if (file.size > 10 * 1024 * 1024) {
                setSubmitError(`File ${file.name} is too large (max 10MB).`);
                return;
            }
            newPhotos.push(file);
            newPreviews.push(URL.createObjectURL(file));
        });

        if (newPhotos.length > 0) {
            setFormData(prev => ({ ...prev, propertyPhotos: [...prev.propertyPhotos, ...newPhotos] }));
            setPreviewPropertyPhotos(prev => [...prev, ...newPreviews]);
        }
        e.target.value = null;
    };

    const removePropertyPhoto = (indexToRemove) => {
        const photoUrlToRevoke = previewPropertyPhotos[indexToRemove];
        URL.revokeObjectURL(photoUrlToRevoke);

        setFormData(prev => ({
            ...prev,
            propertyPhotos: prev.propertyPhotos.filter((_, index) => index !== indexToRemove)
        }));
        setPreviewPropertyPhotos(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const addRoom = () => {
        setFormData(prev => ({
            ...prev,
            rooms: [
                ...prev.rooms,
                {
                    id: Date.now(),
                    bedrooms: 1,
                    bathrooms: 1,
                    maxGuests: 1,
                    pricePerNight: 0,
                    roomPhotos: [],
                    previewRoomPhotos: [],
                }
            ]
        }));
    };

    const removeRoom = (roomIdToRemove) => {
        setFormData(prev => {
            const roomToRemove = prev.rooms.find(room => room.id === roomIdToRemove);
            if (roomToRemove) {
                roomToRemove.previewRoomPhotos.forEach(fileUrl => URL.revokeObjectURL(fileUrl));
            }
            return {
                ...prev,
                rooms: prev.rooms.filter(room => room.id !== roomIdToRemove)
            };
        });
    };

    const handleRoomChange = (roomId, field, value) => {
        setFormData(prev => ({
            ...prev,
            rooms: prev.rooms.map(room =>
                room.id === roomId ? { ...room, [field]: (Number(value) || 0) } : room
            )
        }));
    };

    const handleRoomFileChange = (roomId, e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        setSubmitError('');

        setFormData(prev => {
            const roomIndex = prev.rooms.findIndex(room => room.id === roomId);
            if (roomIndex === -1) return prev;

            const currentRoom = prev.rooms[roomIndex];
            if (files.length + currentRoom.roomPhotos.length > 6) {
                setSubmitError(`You can upload a maximum of 6 photos for this room.`);
                e.target.value = null;
                return prev;
            }

            const newPhotos = [];
            const newPreviews = [];

            files.forEach(file => {
                if (file.size > 10 * 1024 * 1024) {
                    setSubmitError(`File ${file.name} is too large (max 10MB).`);
                    return;
                }
                newPhotos.push(file);
                newPreviews.push(URL.createObjectURL(file));
            });

            if (newPhotos.length > 0) {
                const updatedRooms = [...prev.rooms];
                updatedRooms[roomIndex] = {
                    ...currentRoom,
                    roomPhotos: [...currentRoom.roomPhotos, ...newPhotos],
                    previewRoomPhotos: [...currentRoom.previewRoomPhotos, ...newPreviews],
                };
                return { ...prev, rooms: updatedRooms };
            }
            e.target.value = null;
            return prev;
        });
    };

    const removeRoomPhoto = (roomId, indexToRemove) => {
        setFormData(prev => {
            const roomIndex = prev.rooms.findIndex(room => room.id === roomId);
            if (roomIndex === -1) return prev;

            const currentRoom = prev.rooms[roomIndex];
            const photoUrlToRevoke = currentRoom.previewRoomPhotos[indexToRemove];
            URL.revokeObjectURL(photoUrlToRevoke);

            const updatedRooms = [...prev.rooms];
            updatedRooms[roomIndex] = {
                ...currentRoom,
                roomPhotos: currentRoom.roomPhotos.filter((_, index) => index !== indexToRemove),
                previewRoomPhotos: currentRoom.previewRoomPhotos.filter((_, index) => index !== indexToRemove),
            };
            return { ...prev, rooms: updatedRooms };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError('');

        if (!formData.country || !formData.city || !formData.latitude || !formData.longitude) {
            setSubmitError('Please enter and parse the full address to get location details.');
            window.scrollTo(0, 0);
            return;
        }
        if (formData.propertyPhotos.length < 1 || formData.propertyPhotos.length > 6) {
            setSubmitError('Please add at least 1 and no more than 6 property photos.');
            window.scrollTo(0, 0);
            return;
        }
        for (const room of formData.rooms) {
            if (room.roomPhotos.length < 1 || room.roomPhotos.length > 6) {
                setSubmitError(`Please add at least 1 and no more than 6 photos for each room.`);
                window.scrollTo(0, 0);
                return;
            }
            if (room.pricePerNight <= 0) {
                setSubmitError(`Price per night must be greater than 0 for each room.`);
                window.scrollTo(0, 0);
                return;
            }
            if (room.maxGuests <= 0) {
                setSubmitError(`Max guests must be greater than 0 for each room.`);
                window.scrollTo(0, 0);
                return;
            }
        }
        if (!formData.propertyTypeName) {
            setSubmitError('Please select a property type.');
            window.scrollTo(0,0);
            return;
        }

        setSubmitting(true);
        const dataToSubmit = new FormData();

        dataToSubmit.append('title', formData.title);
        dataToSubmit.append('description', formData.description);
        dataToSubmit.append('countryName', formData.country.name);
        dataToSubmit.append('cityName', formData.city.name);
        dataToSubmit.append('address', formData.address);
        dataToSubmit.append('latitude', formData.latitude.toString());
        dataToSubmit.append('longitude', formData.longitude.toString());
        dataToSubmit.append('propertyTypeName', formData.propertyTypeName);
        dataToSubmit.append('amenityIds', JSON.stringify(formData.amenityIds));
        dataToSubmit.append('ruleOptionIds', JSON.stringify(formData.ruleOptionIds));
        dataToSubmit.append('checkInTime', formData.checkInTime);
        dataToSubmit.append('checkOutTime', formData.checkOutTime);

        // Add rooms data
        formData.rooms.forEach((room, index) => {
            dataToSubmit.append(`rooms[${index}][bedrooms]`, room.bedrooms);
            dataToSubmit.append(`rooms[${index}][bathrooms]`, room.bathrooms);
            dataToSubmit.append(`rooms[${index}][maxGuests]`, room.maxGuests);
            dataToSubmit.append(`rooms[${index}][pricePerNight]`, room.pricePerNight);
        });

        // Add photos
        formData.propertyPhotos.forEach((photoFile) => {
            dataToSubmit.append('propertyPhotos', photoFile);
        });

        formData.rooms.forEach((room, index) => {
            room.roomPhotos.forEach((photoFile) => {
                dataToSubmit.append(`room_${index}_photos`, photoFile);
            });
        });

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setSubmitError('Authentication token is missing. Please log in again.');
                setSubmitting(false);
                navigate('/auth?mode=login&redirect=/add-property');
                return;
            }
            const response = await axios.post('/api/properties', dataToSubmit, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                },
            });
            
            alert('Property created successfully! You are now a Property Owner.');
            navigate(`/property/${response.data.propertyId}`);

        } catch (error) {
            console.error('Error adding property:', error.response ? error.response.data : error.message);
            setSubmitError(error.response?.data?.message || 'Failed to add property. Please check the details and try again.');
            window.scrollTo(0, 0);
        } finally {
            setSubmitting(false);
        }
    };

    if (!googleMapsApiKey) {
        return (
            <div className="min-h-screen flex flex-col">
                <Navbar user={user} />
                <main className="flex-grow flex items-center justify-center p-4">
                    <p className="text-lg text-gray-600">Loading map services, please wait...</p>
                    {addressError && <p className="text-red-500 mt-2">{addressError}</p>}
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <LoadScript 
            googleMapsApiKey={googleMapsApiKey} 
            libraries={LIBRARIES_TO_LOAD}
            onLoad={() => {
                console.log('Google Maps script loaded');
                setIsMapApiLoaded(true);
            }}
            onError={(e) => {
                console.error("Google Maps API script load error:", e);
                setAddressError("Failed to load address suggestions. Please refresh or check your internet connection.");
            }}
        >
            <div className="min-h-screen flex flex-col bg-[#F9F5F2] text-gray-700">
                <Navbar user={user} />
                <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-3">List your property on Apartica</h1>
                    <p className="text-lg text-gray-500 mb-10">...and start welcoming guests in no time!</p>

                    {submitError && (
                        <div className="p-4 mb-6 bg-red-100 border border-red-400 text-red-700 rounded-md shadow-lg" role="alert">
                            <p className="font-bold">Error!</p>
                            <p>{submitError}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Title & Description */}
                        <div className="p-6 bg-white rounded-lg shadow-lg">
                            <div className="mb-6">
                                <label htmlFor="title" className="block text-sm font-semibold text-gray-800 mb-1">Title</label>
                                <p className="text-xs text-gray-500 mb-2">This will be the biggest label that will show up in searches and on the page of your listing.</p>
                                <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2.5 px-3.5 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm" placeholder="e.g., Cozy Downtown Apartment with Stunning Views" required maxLength="100"/>
                            </div>
                            <div>
                                <label htmlFor="description" className="block text-sm font-semibold text-gray-800 mb-1">Description</label>
                                <p className="text-xs text-gray-500 mb-2">To help guests to understand what their stay will be like better.</p>
                                <textarea name="description" id="description" rows="5" value={formData.description} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2.5 px-3.5 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm" placeholder="Describe your property, its unique features, the neighborhood, and what makes it special for guests..." required></textarea>
                            </div>
                        </div>
                        
                        {/* Location Section with Autocomplete */}
                        <div className="p-6 bg-white rounded-lg shadow-lg">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                                <MapPinIcon className="w-6 h-6 mr-2 text-purple-600" /> Location
                            </h2>
                            <div className="mb-4">
                                <label htmlFor="addressAutocompleteInput" className="block text-sm font-medium text-gray-700">
                                    Start typing address for suggestions
                                </label>
                                {isMapApiLoaded ? (
                                    <GoogleAutocomplete
                                        onLoad={onLoadAutocomplete}
                                        onPlaceChanged={onPlaceChanged}
                                        options={{
                                            fields: ["formatted_address", "geometry", "address_components"],
                                        }}
                                    >
                                        <input
                                            type="text"
                                            id="addressAutocompleteInput"
                                            value={currentAddressInput}
                                            onChange={handleAddressInputChange}
                                            placeholder="e.g., Khreshchatyk St, 1, Kyiv, Ukraine"
                                            className="mt-1 flex-grow block w-full border-gray-300 rounded-md py-2.5 px-3.5 focus:ring-purple-500 focus:border-purple-500 sm:text-sm shadow-sm"
                                            disabled={geocodingLoading || submitting}
                                        />
                                    </GoogleAutocomplete>
                                ) : (
                                     <input type="text" placeholder="Loading address suggestions..." disabled className="mt-1 block w-full border-gray-300 rounded-md py-2.5 px-3.5 bg-gray-100"/>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => fetchAddressDetails()}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 mb-4"
                                disabled={geocodingLoading || submitting || !currentAddressInput.trim() || !isMapApiLoaded}
                            >
                                {geocodingLoading ? 'Parsing Address...' : 'Parse Entered/Selected Address'}
                            </button>
                            {addressError && <p className="mt-2 text-sm text-red-600">{addressError}</p>}
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mt-4">
                                <div>
                                    <label htmlFor="parsedCountry" className="block text-sm font-medium text-gray-700">Country</label>
                                    <input type="text" id="parsedCountry" value={formData.country?.name || 'N/A'} disabled className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2.5 px-3.5 bg-gray-100 cursor-not-allowed" />
                                </div>
                                 <div>
                                    <label htmlFor="parsedCity" className="block text-sm font-medium text-gray-700">City</label>
                                    <input type="text" id="parsedCity" value={formData.city?.name || 'N/A'} disabled className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2.5 px-3.5 bg-gray-100 cursor-not-allowed" />
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor="parsedFullAddress" className="block text-sm font-medium text-gray-700">Parsed Full Address</label>
                                    <input type="text" id="parsedFullAddress" value={formData.address || 'N/A'} disabled className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2.5 px-3.5 bg-gray-100 cursor-not-allowed" />
                                </div>
                                <div>
                                    <label htmlFor="latitude" className="block text-sm font-medium text-gray-700">Latitude</label>
                                    <input type="text" id="latitude" value={formData.latitude !== null ? formData.latitude : 'N/A'} disabled className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2.5 px-3.5 bg-gray-100 cursor-not-allowed" />
                                </div>
                                <div>
                                    <label htmlFor="longitude" className="block text-sm font-medium text-gray-700">Longitude</label>
                                    <input type="text" id="longitude" value={formData.longitude !== null ? formData.longitude : 'N/A'} disabled className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2.5 px-3.5 bg-gray-100 cursor-not-allowed" />
                                </div>
                            </div>
                        </div>

                        {/* Property Type */}
                        <div className="p-6 bg-white rounded-lg shadow-lg">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Property Details</h2>
                            <div className="mb-6">
                                <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700">Property type</label>
                                <select 
                                    id="propertyType" 
                                    name="propertyTypeName" 
                                    value={formData.propertyTypeName} 
                                    onChange={handleChange} 
                                    required 
                                    className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md shadow-sm"
                                >
                                    <option value="">Select property type</option>
                                    {propertyTypesFromDB.map(type => (
                                        <option key={type._id} value={type.name}>{type.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        
                        {/* Property Photos */}
                         <div className="p-6 bg-white rounded-lg shadow-lg">
                            <h2 className="text-xl font-semibold text-gray-800 mb-1">Property Photos</h2>
                            <p className="text-xs text-gray-500 mb-4">Add 1-6 photos of your property. Show all the details so renters know what to expect. Recommended size: 1024x1024 pixels, max 10MB each.</p>
                            <div className="mt-1">
                                <label htmlFor="property-file-upload" className="flex justify-center w-full h-32 px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-purple-400 transition-colors">
                                    <div className="space-y-1 text-center">
                                        <UploadIcon className="mx-auto h-10 w-10 text-gray-400" />
                                        <div className="flex text-sm text-gray-600"><span className="font-medium text-purple-600 hover:text-purple-500">Upload files</span><p className="pl-1">or drag and drop</p></div>
                                        <p className="text-xs text-gray-500">PNG, JPG, JPEG up to 10MB each</p>
                                    </div>
                                    <input id="property-file-upload" name="property-file-upload" type="file" className="sr-only" multiple onChange={handlePropertyFileChange} accept="image/png, image/jpeg, image/jpg" disabled={submitting}/>
                                </label>
                            </div>
                            {previewPropertyPhotos.length > 0 && (
                                <div className="mt-6">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Uploaded photos ({previewPropertyPhotos.length}/6):</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                        {previewPropertyPhotos.map((src, index) => (
                                            <div key={src} className="relative group aspect-square">
                                                <img src={src} alt={`Property Preview ${index + 1}`} className="h-full w-full object-cover rounded-md shadow" />
                                                <button type="button" onClick={() => removePropertyPhoto(index)}
                                                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-0.5 w-5 h-5 flex items-center justify-center text-xs leading-none opacity-0 group-hover:opacity-100 hover:bg-red-700 transition-opacity focus:outline-none"
                                                        title="Remove photo" disabled={submitting}>
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Rooms Section */}
                        {formData.rooms.map((room, roomIndex) => (
                            <div key={room.id} className="p-6 bg-white rounded-lg shadow-lg">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-semibold text-gray-800">Room {roomIndex + 1} Details</h2>
                                    {formData.rooms.length > 1 && (
                                        <button type="button" onClick={() => removeRoom(room.id)} className="text-red-500 hover:text-red-700 flex items-center text-sm font-medium disabled:opacity-50" disabled={submitting}>
                                            <MinusCircleIcon className="w-5 h-5 mr-1" /> Remove Room Type
                                        </button>
                                    )}
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                    <div>
                                        <label htmlFor={`bedrooms-${room.id}`} className="block text-sm font-medium text-gray-700">Number of Bedrooms</label>
                                        <input 
                                            type="number" 
                                            id={`bedrooms-${room.id}`} 
                                            value={room.bedrooms} 
                                            min="0" 
                                            onChange={(e) => handleRoomChange(room.id, 'bedrooms', e.target.value)} 
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm py-2.5 px-3.5" 
                                            required 
                                            disabled={submitting} 
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor={`bathrooms-${room.id}`} className="block text-sm font-medium text-gray-700">Number of Bathrooms</label>
                                        <input 
                                            type="number" 
                                            id={`bathrooms-${room.id}`} 
                                            value={room.bathrooms} 
                                            min="0" 
                                            onChange={(e) => handleRoomChange(room.id, 'bathrooms', e.target.value)} 
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm py-2.5 px-3.5" 
                                            required 
                                            disabled={submitting} 
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor={`maxGuests-${room.id}`} className="block text-sm font-medium text-gray-700">Max Guests</label>
                                        <input 
                                            type="number" 
                                            id={`maxGuests-${room.id}`} 
                                            value={room.maxGuests} 
                                            min="1" 
                                            onChange={(e) => handleRoomChange(room.id, 'maxGuests', e.target.value)} 
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm py-2.5 px-3.5" 
                                            required 
                                            disabled={submitting} 
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor={`pricePerNight-${room.id}`} className="block text-sm font-medium text-gray-700">Price per Night (€)</label>
                                        <input 
                                            type="number" 
                                            id={`pricePerNight-${room.id}`} 
                                            value={room.pricePerNight} 
                                            min="0" 
                                            step="0.01" 
                                            onChange={(e) => handleRoomChange(room.id, 'pricePerNight', e.target.value)} 
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm py-2.5 px-3.5" 
                                            required 
                                            disabled={submitting} 
                                        />
                                    </div>
                                </div>
                                
                                <div className="mt-8">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-1">Room {roomIndex + 1} Photos</h3>
                                    <p className="text-xs text-gray-500 mb-4">Add 1-6 photos for this specific room.</p>
                                    <label htmlFor={`room-file-upload-${room.id}`} className="flex justify-center w-full h-32 px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-purple-400 transition-colors">
                                        <div className="space-y-1 text-center">
                                            <UploadIcon className="mx-auto h-10 w-10 text-gray-400" />
                                            <div className="flex text-sm text-gray-600"><span className="font-medium text-purple-600 hover:text-purple-500">Upload files</span><p className="pl-1">or drag and drop</p></div>
                                            <p className="text-xs text-gray-500">PNG, JPG, JPEG up to 10MB each</p>
                                        </div>
                                        <input id={`room-file-upload-${room.id}`} name={`room-file-upload-${room.id}`} type="file" className="sr-only" multiple onChange={(e) => handleRoomFileChange(room.id, e)} accept="image/png, image/jpeg, image/jpg" disabled={submitting}/>
                                    </label>
                                    {room.previewRoomPhotos.length > 0 && (
                                        <div className="mt-6">
                                            <p className="text-sm font-medium text-gray-700 mb-2">Uploaded room photos ({room.previewRoomPhotos.length}/6):</p>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                                {room.previewRoomPhotos.map((src, index) => (
                                                    <div key={src} className="relative group aspect-square">
                                                        <img src={src} alt={`Room Preview ${index + 1}`} className="h-full w-full object-cover rounded-md shadow" />
                                                        <button type="button" onClick={() => removeRoomPhoto(room.id, index)}
                                                                className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-0.5 w-5 h-5 flex items-center justify-center text-xs leading-none opacity-0 group-hover:opacity-100 hover:bg-red-700 transition-opacity focus:outline-none disabled:opacity-50"
                                                                title="Remove photo" disabled={submitting}>
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
                        <div className="flex justify-start pt-4">
                            <button type="button" onClick={addRoom} className="bg-purple-200 hover:bg-purple-300 text-purple-800 font-semibold py-2 px-6 rounded-lg shadow-md transition duration-300 flex items-center disabled:opacity-50" disabled={submitting}>
                                <PlusCircleIcon className="w-5 h-5 mr-2" /> Add Another Room Type
                            </button>
                        </div>
                        
                        {/* Amenities */}
                        <div className="p-6 bg-white rounded-lg shadow-lg">
                            <h2 className="text-xl font-semibold text-gray-800 mb-1">Amenities</h2>
                            <p className="text-xs text-gray-500 mb-4">Choose all the amenities you have at your place.</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3">
                                {amenitiesFromDB.map(amenity => (
                                    <div key={amenity._id} className="flex items-center">
                                        <input 
                                            id={amenity._id} 
                                            type="checkbox" 
                                            checked={formData.amenityIds.includes(amenity._id)} 
                                            onChange={(e) => handleAmenityChange(amenity._id, e.target.checked)}
                                            className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer" 
                                            disabled={submitting}
                                        />
                                        <label htmlFor={amenity._id} className="ml-2.5 block text-sm text-gray-700 cursor-pointer">
                                            {amenity.name}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* House Rules */}
                        <div className="p-6 bg-white rounded-lg shadow-lg">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">House Rules</h2>
                            
                            {/* Check-in/Check-out Times */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-6">
                                <div>
                                    <label htmlFor="checkInTime" className="block text-sm font-medium text-gray-700 mb-1">Check-in Time</label>
                                    <div className="relative">
                                        <input 
                                            type="time" 
                                            name="checkInTime" 
                                            id="checkInTime" 
                                            value={formData.checkInTime} 
                                            onChange={handleChange} 
                                            className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md shadow-sm" 
                                            required 
                                            disabled={submitting}
                                        />
                                        <ClockIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="checkOutTime" className="block text-sm font-medium text-gray-700 mb-1">Check-out Time</label>
                                    <div className="relative">
                                        <input 
                                            type="time" 
                                            name="checkOutTime" 
                                            id="checkOutTime" 
                                            value={formData.checkOutTime} 
                                            onChange={handleChange} 
                                            className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md shadow-sm" 
                                            required 
                                            disabled={submitting}
                                        />
                                        <ClockIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Other House Rules from DB */}
                            {houseRulesFromDB.map(ruleCategory => (
                                ruleCategory.category.name !== 'Check-in/Check-out' && (
                                    <div key={ruleCategory.category._id} className="mb-6">
                                        <h3 className="text-sm font-medium text-gray-700 mb-2">{ruleCategory.category.name}</h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2">
                                            {ruleCategory.options.map(option => (
                                                <div key={option._id} className="flex items-center">
                                                    <input 
                                                        id={option._id} 
                                                        type="checkbox" 
                                                        checked={formData.ruleOptionIds.includes(option._id)} 
                                                        onChange={(e) => handleRuleChange(option._id, e.target.checked)} 
                                                        className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer" 
                                                        disabled={submitting}
                                                    />
                                                    <label htmlFor={option._id} className="ml-2.5 block text-sm text-gray-700 cursor-pointer">
                                                        {option.value}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            ))}
                        </div>
                        
                        {/* Submit Button */}
                        <div className="flex justify-end pt-6 border-t border-gray-200 mt-8">
                            <button
                                type="submit"
                                disabled={submitting || geocodingLoading || !isMapApiLoaded}
                                className="bg-[#8252A1] hover:bg-purple-700 text-white font-semibold py-3 px-10 rounded-lg shadow-md hover:shadow-lg transition duration-300 text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {submitting ? 'Adding Property...' : 'Add new property'}
                            </button>
                        </div>
                    </form>
                </main>
                <Footer />
            </div>
        </LoadScript>
    );
};

export default AddPropertyPage;