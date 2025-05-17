// src/pages/AddPropertyPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

import { PlusCircleIcon } from '@heroicons/react/24/outline';
import { HomeIcon } from '@heroicons/react/24/outline';
import { HomeModernIcon as BedIcon } from '@heroicons/react/24/outline';
import { PhotoIcon } from '@heroicons/react/24/outline';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { ArrowUpTrayIcon as UploadIcon } from '@heroicons/react/24/outline';

const amenitiesList = [
    { id: 'airConditioning', label: 'Air conditioning' },
    { id: 'basicSoaps', label: 'Basic soaps' },
    { id: 'clothesDryer', label: 'Clothes dryer' },
    { id: 'coinLaundry', label: 'Coin laundry' },
    { id: 'fitnessRoom', label: 'Fitness room & equipment' },
    { id: 'hairDryer', label: 'Hair dryer' },
    { id: 'heating', label: 'Heating' },
    { id: 'ironBoard', label: 'Iron & board' },
    { id: 'linens', label: 'Linens' },
    { id: 'toiletPaper', label: 'Toilet paper' },
    { id: 'towels', label: 'Towels' },
    { id: 'washingMachine', label: 'Washing machine' },
    { id: 'wirelessInternet', label: 'Wireless internet' },
];

const propertyTypes = ['Apartment', 'House', 'Condo', 'Townhouse', 'Villa', 'Guest House', 'Loft', 'Other'];

const AddPropertyPage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [formData, setFormData] = useState({
        headline: '',
        description: '',
        country: '',
        city: '',
        address: '',
        amenities: [],
        propertyType: '',
        bedrooms: [{ id: Date.now(), details: '' }],
        bathrooms: [{ id: Date.now() + 1, details: '' }],
        additionalSpaces: [{ id: Date.now() + 2, details: '' }],
        photos: [],
    });
    const [previewPhotos, setPreviewPhotos] = useState([]);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (error) {
                console.error("Failed to parse user from localStorage on AddPropertyPage:", error);
                localStorage.removeItem('user');
            }
        } else {
            navigate('/auth?mode=login&redirect=/add-property');
        }
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
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        if (files.length + formData.photos.length > 6) {
            alert("You can upload a maximum of 6 photos.");
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

    const removePhoto = (indexToRemove) => {
        const photoUrlToRevoke = previewPhotos[indexToRemove];
        URL.revokeObjectURL(photoUrlToRevoke);

        setFormData(prev => ({
            ...prev,
            photos: prev.photos.filter((_, index) => index !== indexToRemove)
        }));
        setPreviewPhotos(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const addDynamicField = (field) => {
        setFormData(prev => ({
            ...prev,
            [field]: [...prev[field], { id: Date.now() + prev[field].length, details: '' }]
        }));
    };

    const removeDynamicField = (field, idToRemove) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].filter(item => item.id !== idToRemove)
        }));
    };

    const handleDynamicFieldChange = (field, id, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].map(item => item.id === id ? { ...item, details: value } : item)
        }));
    };

    // Handles form submission and prepares data for backend
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.photos.length < 1 && formData.photos.length > 6) {
            alert('Please add at least 1 photo and no more than 6.');
            return;
        }

        const dataToSubmit = new FormData();
        Object.keys(formData).forEach(key => {
            if (key === 'photos') {
                formData.photos.forEach(photoFile => {
                    dataToSubmit.append('photos', photoFile, photoFile.name);
                });
            } else if (Array.isArray(formData[key])) {
                dataToSubmit.append(key, JSON.stringify(formData[key]));
            } else {
                dataToSubmit.append(key, formData[key]);
            }
        });

        alert('Form submitted for adding property!');
    };

    useEffect(() => {
        return () => {
            previewPhotos.forEach(fileUrl => URL.revokeObjectURL(fileUrl));
        };
    }, [previewPhotos]);

    return (
        <div className="min-h-screen flex flex-col bg-[#F9F5F2] text-gray-700">
            <Navbar user={user} />
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
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
                            <label htmlFor="headline" className="block text-sm font-semibold text-gray-800 mb-1">Headline</label>
                            <p className="text-xs text-gray-500 mb-2">This will be the biggest label that will show up in searches and on the page of your listing.</p>
                            <input
                                type="text" name="headline" id="headline" value={formData.headline} onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2.5 px-3.5 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                placeholder="e.g., Cozy Downtown Apartment with Stunning Views" required maxLength="100"
                            />
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-semibold text-gray-800 mb-1">Description</label>
                            <p className="text-xs text-gray-500 mb-2">To help guests to understand what their stay will be like better.</p>
                            <textarea
                                name="description" id="description" rows="5" value={formData.description} onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2.5 px-3.5 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                placeholder="Describe your property, its unique features, the neighborhood, and what makes it special for guests..." required
                            ></textarea>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="p-6 bg-white rounded-lg shadow-lg">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Location</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <div>
                                <label htmlFor="country" className="block text-sm font-medium text-gray-700">Country</label>
                                <select id="country" name="country" value={formData.country} onChange={handleChange} required className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md shadow-sm">
                                    <option value="">Select Country</option>
                                    <option>Ukraine</option> <option>Poland</option> <option>Germany</option> <option>USA</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
                                <input type="text" name="city" id="city" value={formData.city} onChange={handleChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm py-2.5 px-3.5" placeholder="e.g., Kyiv"/>
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="address" className="block text-sm font-medium text-gray-700">Full Address</label>
                                <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm py-2.5 px-3.5" placeholder="Street, House Number, Apartment (if any), Postal Code"/>
                            </div>
                        </div>
                    </div>

                    {/* Amenities */}
                    <div className="p-6 bg-white rounded-lg shadow-lg">
                        <h2 className="text-xl font-semibold text-gray-800 mb-1">Amenities</h2>
                        <p className="text-xs text-gray-500 mb-4">Choose all the amenities you have at your place. The more amenities, the more likely people are to book!</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3">
                            {amenitiesList.map(amenity => (
                                <div key={amenity.id} className="flex items-center">
                                    <input id={amenity.id} name="amenities" type="checkbox" value={amenity.id} checked={formData.amenities.includes(amenity.id)} onChange={handleChange}
                                        className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                                    />
                                    <label htmlFor={amenity.id} className="ml-2.5 block text-sm text-gray-700 cursor-pointer">
                                        {amenity.label}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Property Type, Bedrooms, Bathrooms */}
                    <div className="p-6 bg-white rounded-lg shadow-lg">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Property Details</h2>
                        <div className="mb-6">
                            <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700">Property type</label>
                            <select id="propertyType" name="propertyType" value={formData.propertyType} onChange={handleChange} required className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md shadow-sm">
                                <option value="">Select property type</option>
                                {propertyTypes.map(type => <option key={type} value={type}>{type}</option>)}
                            </select>
                        </div>

                        <h3 className="text-lg font-semibold mt-6 mb-3 text-gray-800">Bedrooms and bathrooms</h3>
                        <div className="space-y-4">
                                <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
                                        {formData.bedrooms.map((bedroom, index) => (
                                            <div key={bedroom.id} className="flex items-center gap-2 mb-2 p-3 border rounded-md bg-gray-50">
                                                <BedIcon className="w-5 h-5 text-gray-500 shrink-0" />
                                                <input type="text" value={bedroom.details} onChange={(e) => handleDynamicFieldChange('bedrooms', bedroom.id, e.target.value)} placeholder={`Bedroom ${index + 1} details (e.g., 1 Queen bed)`} className="flex-grow text-sm border-gray-300 rounded-md py-1.5 px-2.5 focus:ring-purple-500 focus:border-purple-500"/>
                                                {formData.bedrooms.length > 1 && <button type="button" onClick={() => removeDynamicField('bedrooms', bedroom.id)} className="text-red-500 hover:text-red-700 text-xs p-1">Remove</button>}
                                            </div>
                                        ))}
                                        <button type="button" onClick={() => addDynamicField('bedrooms')} className="mt-1 text-sm text-purple-600 hover:text-purple-800 font-medium flex items-center py-1">
                                            <PlusCircleIcon className="w-5 h-5 mr-1" /> Add bedroom
                                        </button>
                                </div>
                                <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
                                        {formData.bathrooms.map((bathroom, index) => (
                                            <div key={bathroom.id} className="flex items-center gap-2 mb-2 p-3 border rounded-md bg-gray-50">
                                                <input type="text" value={bathroom.details} onChange={(e) => handleDynamicFieldChange('bathrooms', bathroom.id, e.target.value)} placeholder={`Bathroom ${index + 1} details (e.g., Full bath with shower)`} className="flex-grow text-sm border-gray-300 rounded-md py-1.5 px-2.5 focus:ring-purple-500 focus:border-purple-500"/>
                                                {formData.bathrooms.length > 1 && <button type="button" onClick={() => removeDynamicField('bathrooms', bathroom.id)} className="text-red-500 hover:text-red-700 text-xs p-1">Remove</button>}
                                            </div>
                                        ))}
                                        <button type="button" onClick={() => addDynamicField('bathrooms')} className="mt-1 text-sm text-purple-600 hover:text-purple-800 font-medium flex items-center py-1">
                                            <PlusCircleIcon className="w-5 h-5 mr-1" /> Add bathroom
                                        </button>
                                </div>
                        </div>

                        <h3 className="text-lg font-semibold mt-8 mb-2 text-gray-800">Additional sleeping spaces</h3>
                        <p className="text-xs text-gray-500 mb-3">Describe any additional sleeping spaces like a sofa bed in the living room or office.</p>
                         {formData.additionalSpaces.map((space, index) => (
                            <div key={space.id} className="flex items-center gap-2 mb-2 p-3 border rounded-md bg-gray-50">
                                <input type="text" value={space.details} onChange={(e) => handleDynamicFieldChange('additionalSpaces', space.id, e.target.value)} placeholder={`Additional Space ${index + 1} (e.g., Living room with 1 Sofa bed)`} className="flex-grow text-sm border-gray-300 rounded-md py-1.5 px-2.5 focus:ring-purple-500 focus:border-purple-500"/>
                                 {formData.additionalSpaces.length > 0 && index === formData.additionalSpaces.length -1 && formData.additionalSpaces.length > 1 ?
                                 <button type="button" onClick={() => removeDynamicField('additionalSpaces', space.id)} className="text-red-500 hover:text-red-700 text-xs p-1">Remove</button>
                                 : formData.additionalSpaces.length ===1 && space.details === "" ? null :
                                 formData.additionalSpaces.length > 1 ?  <button type="button" onClick={() => removeDynamicField('additionalSpaces', space.id)} className="text-red-500 hover:text-red-700 text-xs p-1">Remove</button> : null
                                }
                            </div>
                        ))}
                        <button type="button" onClick={() => addDynamicField('additionalSpaces')} className="mt-1 text-sm text-purple-600 hover:text-purple-800 font-medium flex items-center py-1">
                             <PlusCircleIcon className="w-5 h-5 mr-1" /> Add additional space
                        </button>
                    </div>

                    {/* Photos */}
                    <div className="p-6 bg-white rounded-lg shadow-lg">
                        <h2 className="text-xl font-semibold text-gray-800 mb-1">Property Photos</h2>
                        <p className="text-xs text-gray-500 mb-4">Add 1-6 photos of your property. Show all the details so renters know what to expect. Recommended size: 1024x1024 pixels, max 10MB each.</p>
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
                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={handleFileChange} accept="image/png, image/jpeg, image/jpg" />
                                </label>
                        </div>

                        {previewPhotos.length > 0 && (
                            <div className="mt-6">
                                <p className="text-sm font-medium text-gray-700 mb-2">Uploaded photos ({previewPhotos.length}/6):</p>
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
