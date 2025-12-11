import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { incidentAPI } from '../services/api';
import { AlertCircle, MapPin, Upload, Send, X, CheckCircle, Loader, Navigation, Image as ImageIcon, User, Phone, FileText, Zap, Search } from 'lucide-react';

const INCIDENT_TYPES = [
  { 
    value: 'fire', 
    label: 'Fire', 
    emoji: '🔥',
    color: 'from-orange-500 to-orange-600',
    bgColor: 'from-orange-50 to-orange-100',
    description: 'Fire outbreak or smoke'
  },
  { 
    value: 'flood', 
    label: 'Flood', 
    emoji: '🌊',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'from-blue-50 to-blue-100',
    description: 'Water overflow or flooding'
  },
  { 
    value: 'road_block', 
    label: 'Road Block', 
    emoji: '🚧',
    color: 'from-yellow-500 to-yellow-600',
    bgColor: 'from-yellow-50 to-yellow-100',
    description: 'Road closure or obstruction'
  },
  { 
    value: 'building_damage', 
    label: 'Building Damage', 
    emoji: '🏚️',
    color: 'from-red-500 to-red-600',
    bgColor: 'from-red-50 to-red-100',
    description: 'Structural damage or collapse'
  },
  { 
    value: 'medical', 
    label: 'Medical', 
    emoji: '🏥',
    color: 'from-pink-500 to-pink-600',
    bgColor: 'from-pink-50 to-pink-100',
    description: 'Medical emergency'
  },
  { 
    value: 'resource_shortage', 
    label: 'Resource Shortage', 
    emoji: '📦',
    color: 'from-purple-500 to-purple-600',
    bgColor: 'from-purple-50 to-purple-100',
    description: 'Lack of supplies or resources'
  },
  { 
    value: 'other', 
    label: 'Other', 
    emoji: '⚠️',
    color: 'from-gray-500 to-gray-600',
    bgColor: 'from-gray-50 to-gray-100',
    description: 'Other emergency situations'
  },
];

function ReportIncident() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [locationSearch, setLocationSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchingLocation, setSearchingLocation] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    incident_type: '',
    latitude: '',
    longitude: '',
    reporter_name: '',
    reporter_contact: '',
    image: null,
  });

  // Get user's current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6),
          });
          setLocationSearch('Current Location');
          setSearchResults([]);
          setLoading(false);
          setError(null);
        },
        (err) => {
          setError('Unable to get your location. Please search for a location.');
          setLoading(false);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
    }
  };

  // Search for location using Nominatim API
  const searchLocation = async (query) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setSearchingLocation(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (err) {
      console.error('Location search error:', err);
      setError('Failed to search location. Please try again.');
    } finally {
      setSearchingLocation(false);
    }
  };

  // Handle location search input
  const handleLocationSearchChange = (e) => {
    const value = e.target.value;
    setLocationSearch(value);
    
    // Debounce search
    if (value.length >= 3) {
      const timeoutId = setTimeout(() => {
        searchLocation(value);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  };

  // Select location from search results
  const selectLocation = (result) => {
    setFormData({
      ...formData,
      latitude: parseFloat(result.lat).toFixed(6),
      longitude: parseFloat(result.lon).toFixed(6),
    });
    setLocationSearch(result.display_name);
    setSearchResults([]);
    setError(null);
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('Image size should be less than 10MB');
        return;
      }
      
      setFormData({ ...formData, image: file });
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove selected image
  const removeImage = () => {
    setFormData({ ...formData, image: null });
    setImagePreview(null);
  };

  // Validate form
  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Please enter an incident title');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Please enter a description');
      return false;
    }
    if (!formData.incident_type) {
      setError('Please select an incident type');
      return false;
    }
    if (!formData.latitude || !formData.longitude) {
      setError('Please search and select a location, or use your current location');
      return false;
    }
    
    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    
    if (isNaN(lat) || lat < -90 || lat > 90) {
      setError('Invalid latitude. Please select a valid location.');
      return false;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      setError('Invalid longitude. Please select a valid location.');
      return false;
    }
    
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const data = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        incident_type: formData.incident_type,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        reporter_name: formData.reporter_name.trim() || undefined,
        reporter_contact: formData.reporter_contact.trim() || undefined,
      };
      
      console.log('Submitting incident data:', data); // Debug log
      
      const response = await incidentAPI.create(data, formData.image);
      
      console.log('Incident created successfully:', response); // Debug log
      
      setSuccess(true);
      
      // Redirect to map view after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
      
    } catch (err) {
      console.error('Error submitting incident:', err);
      console.error('Error response:', err.response); // Debug log
      
      // Better error message handling
      let errorMessage = 'Failed to submit incident. Please try again.';
      
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          // Validation errors from FastAPI
          errorMessage = err.response.data.detail.map(e => e.msg).join(', ');
        } else if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Success message
  if (success) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 p-4">
        <div className="relative backdrop-blur-xl bg-white/90 border border-white/20 rounded-3xl shadow-2xl p-10 max-w-lg w-full text-center overflow-hidden">
          {/* Animated background circles */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-green-200 to-emerald-200 rounded-full filter blur-3xl opacity-30 animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200 to-cyan-200 rounded-full filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
          
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl animate-bounce">
              <CheckCircle className="w-14 h-14 text-white" strokeWidth={2.5} />
            </div>
            <h2 className="text-3xl font-black text-slate-800 mb-3 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Report Submitted!
            </h2>
            <p className="text-slate-600 text-lg mb-6 leading-relaxed">
              Your incident report has been successfully submitted and is being processed by our AI verification system.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="font-medium">Redirecting to map view...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 max-w-5xl">
        {/* Enhanced Header */}
        <div className="backdrop-blur-xl bg-white/80 border border-white/20 rounded-3xl shadow-xl p-6 sm:p-8 mb-6 sm:mb-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl shadow-lg flex-shrink-0">
              <AlertCircle className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-black text-slate-800 mb-2 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Report Emergency Incident
              </h1>
              <p className="text-slate-600 text-base leading-relaxed">
                Provide accurate incident details to enable rapid emergency response. Your report will be verified using AI-powered analysis and immediately dispatched to response teams.
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                  <Zap className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-700">AI Verification</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-700">Real-time Processing</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="backdrop-blur-xl bg-red-50/90 border-l-4 border-red-600 rounded-2xl p-5 mb-6 shadow-lg animate-shake">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-red-900 mb-1">Validation Error</h4>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
              <button 
                onClick={() => setError(null)}
                className="p-1 hover:bg-red-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-red-600" />
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Incident Type Selection */}
          <div className="backdrop-blur-xl bg-white/80 border border-white/20 rounded-3xl shadow-xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <label className="block text-lg font-bold text-slate-800">
                  Incident Type <span className="text-red-500">*</span>
                </label>
                <p className="text-sm text-slate-500">Select the category that best describes the emergency</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {INCIDENT_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, incident_type: type.value })}
                  className={`group relative overflow-hidden backdrop-blur-sm rounded-2xl p-4 border-2 transition-all duration-300 ${
                    formData.incident_type === type.value
                      ? 'border-red-500 shadow-xl scale-105'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-lg'
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${formData.incident_type === type.value ? type.bgColor : 'from-white to-slate-50'} opacity-90`}></div>
                  <div className="relative text-center">
                    <div className="text-4xl mb-2 transform group-hover:scale-110 transition-transform">
                      {type.emoji}
                    </div>
                    <div className={`font-bold text-sm ${formData.incident_type === type.value ? 'text-slate-800' : 'text-slate-600'}`}>
                      {type.label}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{type.description}</p>
                  </div>
                  {formData.incident_type === type.value && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="w-5 h-5 text-red-600" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Incident Details */}
          <div className="backdrop-blur-xl bg-white/80 border border-white/20 rounded-3xl shadow-xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Incident Details</h3>
            </div>

            <div className="space-y-5">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-bold text-slate-700 mb-2">
                  Incident Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Building collapse on Main Street"
                  className="w-full px-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-red-500/20 focus:border-red-500 transition-all duration-200 font-medium text-slate-800 placeholder:text-slate-400"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-bold text-slate-700 mb-2">
                  Detailed Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Provide comprehensive details: What happened? When did it occur? Are there injuries? Is immediate help required?"
                  rows="5"
                  className="w-full px-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-red-500/20 focus:border-red-500 transition-all duration-200 font-medium text-slate-800 placeholder:text-slate-400 resize-none"
                  required
                />
                <p className="text-xs text-slate-500 mt-2">Be as specific as possible to help emergency responders</p>
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="backdrop-blur-xl bg-white/80 border border-white/20 rounded-3xl shadow-xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-green-100 to-emerald-200 rounded-xl">
                <MapPin className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Location Information</h3>
                <p className="text-sm text-slate-500">Search for a location or use current position</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Current Location Button */}
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={loading}
                className="group w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <Navigation className="w-5 h-5 group-hover:rotate-45 transition-transform duration-300" />
                <span>Use My Current Location</span>
              </button>

              {/* Location Search */}
              <div className="relative">
                <label htmlFor="location-search" className="block text-sm font-bold text-slate-700 mb-2">
                  Search Location <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="location-search"
                    value={locationSearch}
                    onChange={handleLocationSearchChange}
                    placeholder="e.g., Times Square, New York or Main Street, Los Angeles"
                    className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 font-medium text-slate-800 placeholder:text-slate-400"
                    required={!formData.latitude && !formData.longitude}
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  {searchingLocation && (
                    <Loader className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-600 animate-spin" />
                  )}
                </div>
                
                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white border-2 border-slate-200 rounded-xl shadow-2xl max-h-64 overflow-y-auto">
                    {searchResults.map((result, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => selectLocation(result)}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-slate-100 last:border-b-0 flex items-start gap-3"
                      >
                        <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{result.display_name}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            Lat: {parseFloat(result.lat).toFixed(4)}, Lon: {parseFloat(result.lon).toFixed(4)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Coordinates Display */}
              {formData.latitude && formData.longitude && (
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-green-900">Location Confirmed</p>
                    <p className="text-xs text-green-700 font-mono mt-1">
                      {formData.latitude}, {formData.longitude}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, latitude: '', longitude: '' });
                      setLocationSearch('');
                    }}
                    className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-green-700" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Image Upload */}
          <div className="backdrop-blur-xl bg-white/80 border border-white/20 rounded-3xl shadow-xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl">
                <ImageIcon className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Visual Evidence (Optional)</h3>
                <p className="text-sm text-slate-500">Photos help verify the incident faster</p>
              </div>
            </div>
            
            {!imagePreview ? (
              <div className="relative group">
                <input
                  type="file"
                  id="image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <label 
                  htmlFor="image" 
                  className="block cursor-pointer border-3 border-dashed border-slate-300 rounded-2xl p-10 text-center hover:border-red-500 hover:bg-red-50/50 transition-all duration-300"
                >
                  <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="w-10 h-10 text-slate-400 group-hover:text-red-500 transition-colors" />
                  </div>
                  <p className="text-base font-bold text-slate-700 mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-sm text-slate-500">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </label>
              </div>
            ) : (
              <div className="relative group rounded-2xl overflow-hidden shadow-xl">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-80 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-4 right-4 p-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 shadow-lg hover:scale-110"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-xl">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-bold text-slate-800">Image uploaded successfully</span>
                </div>
              </div>
            )}
          </div>

          {/* Reporter Information (Optional) */}
          <div className="backdrop-blur-xl bg-white/80 border border-white/20 rounded-3xl shadow-xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl">
                <User className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Your Information (Optional)</h3>
                <p className="text-sm text-slate-500">Help us contact you for follow-up</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="reporter_name" className="block text-sm font-bold text-slate-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="reporter_name"
                    name="reporter_name"
                    value={formData.reporter_name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 font-medium text-slate-800 placeholder:text-slate-400"
                  />
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>
              <div>
                <label htmlFor="reporter_contact" className="block text-sm font-bold text-slate-700 mb-2">
                  Contact (Phone/Email)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="reporter_contact"
                    name="reporter_contact"
                    value={formData.reporter_contact}
                    onChange={handleChange}
                    placeholder="+1 234 567 8900"
                    className="w-full pl-10 pr-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 font-medium text-slate-800 placeholder:text-slate-400"
                  />
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              disabled={loading}
              className="group flex-1 relative overflow-hidden px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-700 to-red-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center justify-center gap-3">
                {loading ? (
                  <>
                    <Loader className="w-6 h-6 animate-spin" />
                    <span className="text-lg">Submitting Report...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    <span className="text-lg">Submit Emergency Report</span>
                  </>
                )}
              </div>
            </button>
            
            <button
              type="button"
              onClick={() => navigate('/')}
              disabled={loading}
              className="sm:w-40 px-6 py-4 bg-white border-2 border-slate-300 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReportIncident;
