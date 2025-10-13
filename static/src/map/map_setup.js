import { loadCustomIcons } from "../data/data_manager.js";

const iconSize = 24;
const iconAnchor = 12;

export const baseLayers = {
  "CartoDB Dark Matter": L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap contributors'
  }),
  "OpenStreetMap": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  })
};

export const icons = {
  pin: L.icon({
    iconUrl: './static/default-icons/pin.png',
    iconSize: [iconSize, iconSize],
    iconAnchor: [iconAnchor, iconAnchor]
  }),
  point: L.icon({
    iconUrl: './static/default-icons/point.png',
    iconSize: [iconSize, iconSize],
    iconAnchor: [iconAnchor, iconAnchor]
  })
};

export const map = L.map('map', {
  center: [48.379, 31.165],
  zoom: 7,
  layers: [baseLayers["CartoDB Dark Matter"]],
  preferCanvas: !L.Browser.svg && !L.Browser.vml
});

L.control.layers(baseLayers).addTo(map);
window.map = map;

window.addEventListener('load', async function() {
  const customIcons = await loadCustomIcons();

  customIcons.forEach(file => {
    const name = file.replace(/\..+$/, '');
    icons[name] = L.icon({
      iconUrl: `./static/custom-icons/${file}`,
      iconSize: [iconSize, iconSize],
      iconAnchor: [iconAnchor, iconAnchor]
    });
  });
});
