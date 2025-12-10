export const INCIDENT_TYPES = {
  fire: { label: 'Fire', color: '#DC2626', icon: '🔥' },
  flood: { label: 'Flood', color: '#2563EB', icon: '🌊' },
  road_block: { label: 'Road Block', color: '#D97706', icon: '🚧' },
  building_damage: { label: 'Building Damage', color: '#EA580C', icon: '🏚️' },
  medical: { label: 'Medical Emergency', color: '#DC2626', icon: '🏥' },
  resource_shortage: { label: 'Resource Shortage', color: '#059669', icon: '📦' },
  other: { label: 'Other', color: '#6B7280', icon: '❓' },
};

export const URGENCY_LEVELS = {
  critical: { label: 'Critical', color: '#7F1D1D', priority: 4 },
  high: { label: 'High', color: '#DC2626', priority: 3 },
  medium: { label: 'Medium', color: '#D97706', priority: 2 },
  low: { label: 'Low', color: '#059669', priority: 1 },
};

export const INCIDENT_STATUS = {
  pending: { label: 'Pending', color: '#D97706' },
  verified: { label: 'Verified', color: '#059669' },
  rejected: { label: 'Rejected', color: '#DC2626' },
  resolved: { label: 'Resolved', color: '#6B7280' },
};

export const DEFAULT_MAP_CENTER = [7.8731, 80.7718]; // Sri Lanka (center)
export const DEFAULT_MAP_ZOOM = 8;
