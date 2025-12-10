import { format, formatDistanceToNow } from 'date-fns';

export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return format(date, 'MMM dd, yyyy HH:mm');
};

export const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return formatDistanceToNow(date, { addSuffix: true });
};

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
