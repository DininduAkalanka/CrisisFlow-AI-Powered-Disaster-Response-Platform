import { format, formatDistanceToNow } from 'date-fns';

/**
 * Format ISO date string to readable date and time
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date string (e.g., "Jan 15, 2025 14:30")
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return format(date, 'MMM dd, yyyy HH:mm');
};

/**
 * Format date string as relative time
 * @param {string} dateString - ISO date string
 * @returns {string} Relative time string (e.g., "2 hours ago")
 */
export const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return formatDistanceToNow(date, { addSuffix: true });
};

/**
 * Truncate text to specified length with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} Truncated text with ellipsis if needed
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const getIncidentTypeLabel = (type) => {
  const labels = {
    fire: 'Fire',
    flood: 'Flood',
    road_block: 'Road Block',
    building_damage: 'Building Damage',
    medical: 'Medical Emergency',
    resource_shortage: 'Resource Shortage',
    other: 'Other',
  };
  return labels[type] || type;
};

export const getUrgencyColor = (urgency) => {
  const colors = {
    critical: '#7F1D1D',
    high: '#DC2626',
    medium: '#D97706',
    low: '#059669',
  };
  return colors[urgency] || '#6B7280';
};

/**
 * Calculate great-circle distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance.toFixed(2);
};
