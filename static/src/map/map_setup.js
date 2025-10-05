export const baseLayers = {
  "CartoDB Dark Matter": L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap contributors'
  }),
  "OpenStreetMap": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  })
};

export const icons = {
  drawingPin: L.icon({
    iconUrl: './static/icons/map-pin.png',
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  }),
  point: L.icon({
    iconUrl: './static/icons/map-point.png',
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  })
};

export const map = L.map('map', {
  center: [48.379, 31.165],
  zoom: 7,
  layers: [baseLayers["CartoDB Dark Matter"]]
});

L.control.layers(baseLayers).addTo(map);
