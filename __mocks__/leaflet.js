// Mock for Leaflet library
const mockIcon = jest.fn().mockImplementation((options) => ({
  ...options,
  iconUrl: options?.iconUrl || '/marker-icon.png',
  shadowUrl: options?.shadowUrl || '/marker-shadow.png',
  iconSize: options?.iconSize || [25, 41],
  iconAnchor: options?.iconAnchor || [12, 41],
  popupAnchor: options?.popupAnchor || [1, -34],
  shadowSize: options?.shadowSize || [41, 41]
}));

mockIcon.Default = {
  prototype: {
    _getIconUrl: jest.fn()
  },
  mergeOptions: jest.fn()
};

const mockLeaflet = {
  map: jest.fn(() => ({
    setView: jest.fn().mockReturnThis(),
    on: jest.fn(),
    off: jest.fn(),
    remove: jest.fn(),
    getZoom: jest.fn(() => 10),
    addLayer: jest.fn(),
    removeLayer: jest.fn()
  })),
  tileLayer: jest.fn(() => ({
    addTo: jest.fn(),
  })),
  marker: jest.fn(() => ({
    addTo: jest.fn(),
    bindPopup: jest.fn(),
    on: jest.fn(),
  })),
  icon: jest.fn(() => ({
    iconUrl: '/marker-icon.png',
    shadowUrl: '/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  })),
  divIcon: jest.fn(() => ({
    className: 'custom-div-icon',
    html: '<div>Custom Icon</div>',
    iconSize: [30, 42],
    iconAnchor: [15, 42]
  })),
  markerClusterGroup: jest.fn(() => ({
    addLayer: jest.fn(),
    removeLayer: jest.fn(),
    clearLayers: jest.fn(),
    addTo: jest.fn()
  })),
  Icon: mockIcon
};

// Mock global L object
global.L = mockLeaflet;

// Set default export
mockLeaflet.default = mockLeaflet;

module.exports = mockLeaflet;