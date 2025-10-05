import { saveGeoJSONToDatabase } from "../data/data_manager.js";
import { refreshDatasetsList } from "../ui/ui.js";
import { map, icons } from "./map_setup.js";
import { clearLayers, createGeoJSON } from "./map_utils.js";

let drawing = false;
let mode = 0;
let selectedPoints = [];
let lyrsList = [];
let tempLine = null;

const pointBtn = document.getElementById("point-feature-btn");
const lineBtn = document.getElementById("line-feature-btn");
const polyBtn = document.getElementById("polygon-feature-btn");

pointBtn.addEventListener('click', () => toggleDrawing(0, pointBtn));
lineBtn.addEventListener('click', () => toggleDrawing(1, lineBtn));
polyBtn.addEventListener('click', () => toggleDrawing(2, polyBtn));

L.DomEvent.disableClickPropagation(pointBtn);
L.DomEvent.disableClickPropagation(lineBtn);
L.DomEvent.disableClickPropagation(polyBtn);

map.on('click', e => {
  if (!drawing) return;
  const latlng = e.latlng;
  selectedPoints.push([latlng.lng, latlng.lat]);
  const marker = L.marker(latlng, { icon: icons.drawingPin }).addTo(map);
  lyrsList.push(marker);
  if (selectedPoints.length > 1 && mode !== 0) {
    if (lyrsList.permanentLine) map.removeLayer(lyrsList.permanentLine);
    const lineLatLngs = selectedPoints.map(([lng, lat]) => [lat, lng]);
    const polyline = L.polyline(lineLatLngs, { color: '#0078d4', weight: 2 }).addTo(map);
    lyrsList.permanentLine = polyline;
  }
});

map.on('mousemove', e => {
  if (!drawing || selectedPoints.length === 0 || mode === 0) return;
  const last = selectedPoints[selectedPoints.length - 1];
  const lastLatLng = [last[1], last[0]];
  const currentLatLng = [e.latlng.lat, e.latlng.lng];
  if (tempLine) tempLine.setLatLngs([lastLatLng, currentLatLng]);
  else tempLine = L.polyline([lastLatLng, currentLatLng], { color: '#0078d4', dashArray: '5,5', weight: 2 }).addTo(map);
});

async function toggleDrawing(m, btn) {
  drawing = !drawing;
  mode = m;
  if (drawing) {
    map.getContainer().style.cursor = 'crosshair';
    btn.classList.add('active');
  } else {
    map.getContainer().style.cursor = '';
    btn.classList.remove('active');
    if (selectedPoints.length > 0) {
      const geo = buildFeature(mode);
      await saveGeoJSONToDatabase(geo, "test.geojson");
      refreshDatasetsList();
    }
    selectedPoints = [];
    clearLayers(map, lyrsList);
    if (tempLine) {
      map.removeLayer(tempLine);
      tempLine = null;
    }
  }
}

function buildFeature(mode) {
  if (mode === 0) return createGeoJSON("MultiPoint", selectedPoints);
  if (mode === 1) return createGeoJSON("LineString", selectedPoints);
  if (mode === 2) return createGeoJSON("Polygon", [[...selectedPoints, selectedPoints[0]]]);
}
