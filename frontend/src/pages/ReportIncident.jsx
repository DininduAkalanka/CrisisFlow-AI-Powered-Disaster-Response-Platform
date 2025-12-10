import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { incidentAPI } from '../services/api';
import { INCIDENT_TYPES } from '../utils/constants';
import { MapPin, Upload, AlertCircle, Search, X } from 'lucide-react';

function ReportIncident() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    latitude: '',
    longitude: '',
    address: '',
    title: '',
    description: '',
    incident_type: 'other',
    reporter_name: '',
    reporter_contact: '',
  });

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  
  // Location search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Debounced search for location
  useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      searchLocation(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchLocation = async (query) => {
    setSearching(true);
    try {
      // Using Nominatim API (OpenStreetMap) for geocoding - focused on Sri Lanka
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(query)}&` +
        `countrycodes=lk&` + // Limit to Sri Lanka
        `format=json&` +
        `limit=5&` +
        `addressdetails=1`
      );
      const data = await response.json();
      setSearchResults(data);
      setShowResults(true);
    } catch (error) {
      console.error('Location search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  const selectLocation = (location) => {
    setFormData({
      ...formData,
      latitude: parseFloat(location.lat).toFixed(6),
      longitude: parseFloat(location.lon).toFixed(6),
      address: location.display_name,
    });
    setSearchQuery(location.display_name);
    setShowResults(false);
  };

  const clearLocation = () => {
    setFormData({
      ...formData,
      latitude: '',
      longitude: '',
      address: '',
    });
    setSearchQuery('');
    setSearchResults([]);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude.toFixed(6);
          const lon = position.coords.longitude.toFixed(6);
          
          setFormData({
            ...formData,
            latitude: lat,
            longitude: lon,
          });

          // Reverse geocode to get address
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?` +
              `lat=${lat}&lon=${lon}&format=json`
            );
            const data = await response.json();
            setFormData(prev => ({
              ...prev,
              address: data.display_name,
            }));
            setSearchQuery(data.display_name);
          } catch (error) {
            console.error('Reverse geocoding failed:', error);
          }
        },
        (error) => {
          setError('Unable to get your location. Please search for a location manually.');
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate coordinates before submission
    const lat = parseFloat(formData.latitude);
    const lon = parseFloat(formData.longitude);

    if (!formData.latitude || !formData.longitude) {
      setError('Please select a location or enter coordinates');
      return;
    }

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      setError('Invalid coordinates. Please check latitude and longitude values.');
      return;
    }

    // Additional validation for Sri Lanka region
    if (lat < 5.9 || lat > 9.8 || lon < 79.5 || lon > 81.9) {
      const confirmOutside = window.confirm(
        'The coordinates appear to be outside Sri Lanka. Do you want to continue?'
      );
      if (!confirmOutside) {
        return;
      }
    }

    setLoading(true);

    try {
      const dataToSend = {
        ...formData,
        latitude: lat,
        longitude: lon,
      };

      await incidentAPI.create(dataToSend, image);
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to submit incident');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Report Submitted!</h2>
          <p className="text-gray-600 mb-4">
            Your incident report has been received and is being analyzed by our AI system.
          </p>
          <p className="text-sm text-gray-500">Redirecting to map view...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 max-w-3xl">
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 lg:p-8">
          <div className="flex items-start sm:items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
            <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-crisis-red flex-shrink-0" />
            <div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold">Report an Incident</h2>
              <p className="text-xs sm:text-sm lg:text-base text-gray-600">Help responders by providing accurate information</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg mb-4 sm:mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Location Section */}
            <div className="border-b pb-4 sm:pb-6">
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Location</h3>
              
              <div className="mb-3 sm:mb-4">
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition w-full sm:w-auto text-sm sm:text-base touch-manipulation"
                >
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Use Current Location</span>
                </button>
              </div>

              {/* Location Search */}
              <div className="mb-3 sm:mb-4 relative">
                <label className="block text-xs sm:text-sm font-medium mb-2">
                  Search Location *
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for a location in Sri Lanka..."
                    className="w-full pl-9 sm:pl-10 pr-9 sm:pr-10 py-3 sm:py-3.5 border rounded-lg focus:ring-2 focus:ring-crisis-red focus:border-transparent text-sm sm:text-base touch-manipulation"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={clearLocation}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>

                {/* Search Results Dropdown */}
                {showResults && searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 sm:max-h-60 overflow-y-auto">
                    {searchResults.map((result) => (
                      <button
                        key={result.place_id}
                        type="button"
                        onClick={() => selectLocation(result)}
                        className="w-full text-left px-3 sm:px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 touch-manipulation"
                      >
                        <div className="flex items-start space-x-2">
                          <MapPin className="w-4 h-4 text-crisis-red mt-1 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {result.display_name.split(',')[0]}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {result.display_name}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {searching && (
                  <div className="text-sm text-gray-500 mt-2">Searching...</div>
                )}
              </div>

              {/* Selected Location Display */}
              {formData.latitude && formData.longitude && formData.address && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium text-green-900 mb-1">Location Selected</div>
                      <div className="text-sm text-green-700 mb-2">{formData.address}</div>
                      <div className="text-xs text-green-600">
                        📍 {formData.latitude}, {formData.longitude}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Manual Coordinate Entry (Optional) */}
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-2 text-gray-600">
                  Or Enter Coordinates Manually (Optional)
                </label>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Latitude</label>
                    <input
                      type="number"
                      name="latitude"
                      value={formData.latitude}
                      onChange={handleChange}
                      step="any"
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-2 border rounded-lg focus:ring-2 focus:ring-crisis-red focus:border-transparent text-sm touch-manipulation"
                      placeholder="7.8731"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Longitude</label>
                    <input
                      type="number"
                      name="longitude"
                      value={formData.longitude}
                      onChange={handleChange}
                      step="any"
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-2 border rounded-lg focus:ring-2 focus:ring-crisis-red focus:border-transparent text-sm touch-manipulation"
                      placeholder="80.7718"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Sri Lanka coordinates: Latitude 5.9° to 9.8°, Longitude 79.5° to 81.9°
                </p>
              </div>
            </div>

            {/* Incident Details */}
            <div className="border-b pb-4 sm:pb-6">
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Incident Details</h3>

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-2">Incident Type *</label>
                  <select
                    name="incident_type"
                    value={formData.incident_type}
                    onChange={handleChange}
                    required
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-2 border rounded-lg focus:ring-2 focus:ring-crisis-red focus:border-transparent text-sm sm:text-base touch-manipulation"
                  >
                    {Object.entries(INCIDENT_TYPES).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value.icon} {value.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-2">Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    minLength={5}
                    maxLength={200}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-2 border rounded-lg focus:ring-2 focus:ring-crisis-red focus:border-transparent text-sm sm:text-base touch-manipulation"
                    placeholder="Brief description of the incident"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-2">Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    minLength={10}
                    rows={4}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-2 border rounded-lg focus:ring-2 focus:ring-crisis-red focus:border-transparent text-sm sm:text-base touch-manipulation resize-y"
                    placeholder="Provide detailed information about what happened, who is affected, and what help is needed..."
                  />
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Be as specific as possible. Our AI will analyze your text to extract key information.
                  </p>
                </div>
              </div>
            </div>

            {/* Image Upload */}
            <div className="border-b pb-4 sm:pb-6">
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Photo Evidence (Optional)</h3>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center touch-manipulation"
                >
                  {imagePreview ? (
                    <div className="mb-3 sm:mb-4 w-full">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-w-full h-48 sm:h-64 object-contain rounded-lg mx-auto"
                      />
                    </div>
                  ) : (
                    <Upload className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mb-3 sm:mb-4" />
                  )}
                  <p className="text-sm sm:text-base text-blue-600 font-medium">
                    {imagePreview ? 'Change Photo' : 'Upload Photo'}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1 px-2">
                    Our AI will analyze the image for authenticity and severity
                  </p>
                </label>
              </div>
            </div>

            {/* Reporter Info */}
            <div className="border-b pb-4 sm:pb-6">
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Your Information (Optional)</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-2">Your Name</label>
                  <input
                    type="text"
                    name="reporter_name"
                    value={formData.reporter_name}
                    onChange={handleChange}
                    maxLength={100}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-2 border rounded-lg focus:ring-2 focus:ring-crisis-red focus:border-transparent text-sm sm:text-base touch-manipulation"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-2">Contact (Phone/Email)</label>
                  <input
                    type="text"
                    name="reporter_contact"
                    value={formData.reporter_contact}
                    onChange={handleChange}
                    maxLength={100}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-2 border rounded-lg focus:ring-2 focus:ring-crisis-red focus:border-transparent text-sm sm:text-base touch-manipulation"
                    placeholder="555-1234 or email@example.com"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3.5 sm:py-3 bg-crisis-red text-white rounded-lg hover:bg-red-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-base touch-manipulation min-h-[48px]"
              >
                {loading ? 'Submitting...' : 'Submit Report'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-6 py-3.5 sm:py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-base sm:text-base touch-manipulation min-h-[48px]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ReportIncident;
