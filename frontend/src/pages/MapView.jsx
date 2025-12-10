import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { incidentAPI } from '../services/api';
import { INCIDENT_TYPES, DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '../utils/constants';
import { formatTimeAgo, truncateText } from '../utils/helpers';
import { Filter, RefreshCw } from 'lucide-react';

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapView() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    incident_type: '',
    urgency: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadIncidents();
  }, [filters]);

  const loadIncidents = async () => {
    try {
      setLoading(true);
      const data = await incidentAPI.list({
        page: 1,
        page_size: 100,
        ...filters,
      });
      setIncidents(data.incidents);
    } catch (error) {
      console.error('Error loading incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMarkerIcon = (incident) => {
    const typeInfo = INCIDENT_TYPES[incident.incident_type] || INCIDENT_TYPES.other;
    
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: ${typeInfo.color};
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          font-size: 16px;
        ">
          ${typeInfo.icon}
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    });
  };

  return (
    <div className="relative h-full">
      {/* Filter Panel */}
      {showFilters && (
        <div className="absolute top-4 right-4 sm:top-4 sm:right-4 bottom-auto sm:bottom-auto left-4 sm:left-auto z-[1000] bg-white rounded-lg shadow-2xl p-4 w-auto sm:w-64 max-w-md">
          <h3 className="font-bold text-base sm:text-lg mb-3">Filters</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2.5 border rounded-lg text-sm touch-manipulation"
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Incident Type</label>
              <select
                value={filters.incident_type}
                onChange={(e) => setFilters({ ...filters, incident_type: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">All</option>
                {Object.entries(INCIDENT_TYPES).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Urgency</label>
              <select
                value={filters.urgency}
                onChange={(e) => setFilters({ ...filters, urgency: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">All</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <button
              onClick={() => setFilters({ status: '', incident_type: '', urgency: '' })}
              className="w-full px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col sm:flex-row gap-2">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="bg-white p-2.5 sm:p-3 rounded-lg shadow-lg hover:bg-gray-50 flex items-center justify-center sm:justify-start space-x-2 touch-manipulation min-w-[44px]"
        >
          <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline text-sm">Filters</span>
        </button>

        <button
          onClick={loadIncidents}
          disabled={loading}
          className="bg-white p-2.5 sm:p-3 rounded-lg shadow-lg hover:bg-gray-50 flex items-center justify-center sm:justify-start space-x-2 touch-manipulation min-w-[44px]"
        >
          <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline text-sm">Refresh</span>
        </button>
      </div>

      {/* Incident Count */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white px-3 sm:px-4 py-2 rounded-lg shadow-lg">
        <p className="text-xs sm:text-sm font-semibold">
          {incidents.length} incident{incidents.length !== 1 ? 's' : ''} displayed
        </p>
      </div>

      {/* Map */}
      <MapContainer
        center={DEFAULT_MAP_CENTER}
        zoom={DEFAULT_MAP_ZOOM}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {incidents.map((incident) => (
          <Marker
            key={incident.id}
            position={[incident.latitude, incident.longitude]}
            icon={getMarkerIcon(incident)}
          >
            <Popup>
              <div className="p-2 max-w-xs">
                <h3 className="font-bold text-lg mb-2">{incident.title}</h3>
                <p className="text-sm text-gray-600 mb-2">
                  {truncateText(incident.description, 100)}
                </p>
                
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Type:</span>
                    <span className="px-2 py-1 rounded text-white" style={{
                      backgroundColor: INCIDENT_TYPES[incident.incident_type]?.color
                    }}>
                      {INCIDENT_TYPES[incident.incident_type]?.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-medium">Urgency:</span>
                    <span className={`px-2 py-1 rounded urgency-${incident.urgency_level}`}>
                      {incident.urgency_level.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-medium">Status:</span>
                    <span>{incident.status}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-medium">Reported:</span>
                    <span>{formatTimeAgo(incident.created_at)}</span>
                  </div>

                  {incident.ai_confidence_score && (
                    <div className="flex items-center justify-between">
                      <span className="font-medium">AI Confidence:</span>
                      <span>{(incident.ai_confidence_score * 100).toFixed(0)}%</span>
                    </div>
                  )}
                </div>

                {incident.image_url && (
                  <img
                    src={incident.image_url}
                    alt="Incident"
                    className="mt-2 rounded-lg w-full"
                  />
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {loading && (
        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[2000]">
          <div className="spinner"></div>
        </div>
      )}
    </div>
  );
}

export default MapView;
