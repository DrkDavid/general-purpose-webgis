const dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution: '© OpenStreetMap contributors'
});

const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
});

const map = L.map('map', {
  center: [48.379, 31.165],
  zoom: 7,
  layers: [osm]
});

const baseMaps = {
  "CartoDB Dark Matter" : dark,
  "OpenStreetMap": osm,
};

L.control.layers(baseMaps).addTo(map);