import { saveGeoJSONToDatabase, updateGeoJSONToDatabase } from "../data/data_manager.js";
import { refreshDatasetsList, showIconPicker } from "../ui/ui.js";
import { map, icons } from "./map_setup.js";
import { clearLayers, createGeoJSON, prepareFeatureChanges } from "./map_utils.js";

let currentDatasetId = null;
let drawing = false;
let mode = 0;
let selectedPoints = [];
let pointFeatures = [];
let lyrsList = [];
let tempLine = null;

const drawingButtons = document.querySelectorAll('[data-draw-mode]');

drawingButtons.forEach(btn => {
  const mode = parseInt(btn.dataset.drawMode);
  btn.addEventListener('click', () => toggleDrawing(mode, btn));
  L.DomEvent.disableClickPropagation(btn);
});

map.on('click', e => {
  if (!drawing) return;
  const latlng = e.latlng;
  const marker = L.marker(latlng, { icon: icons.pin }).addTo(map);
  var featureEntry = { marker, latlng, props: {} };

  pointFeatures.push(featureEntry);
  lyrsList.push(marker);
  selectedPoints.push([latlng.lng, latlng.lat,]);

  bindEditablePopup(featureEntry);
  marker.openPopup();

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
    drawingButtons.forEach(b => {
      if (b != btn) b.disabled = true;
    });
  } else {
    map.getContainer().style.cursor = '';
    btn.classList.remove('active');
    drawingButtons.forEach(b => (b.disabled = false));
    if (selectedPoints.length > 0) {
      const geoData = buildFeature(mode);
      await saveGeoJSONToDatabase(geoData, "test.geojson");
      refreshDatasetsList();
    }
    selectedPoints = [];
    pointFeatures = [];
    clearLayers(map, lyrsList);
    if (tempLine) {
      map.removeLayer(tempLine);
      tempLine = null;
    }
  }
}

function buildFeature(mode) {
  if (mode === 0) {
    const coordinates = pointFeatures.map(f => [f.latlng.lng, f.latlng.lat]);
    const properties = pointFeatures.map(f => f.props);
    return createGeoJSON("MultiPoint", coordinates, properties);
  }
  if (mode === 1) return createGeoJSON("LineString", selectedPoints);
  if (mode === 2) return createGeoJSON("Polygon", [[...selectedPoints, selectedPoints[0]]]);
}

export function setCurrentDatasetId(datasetId) {
  currentDatasetId = datasetId;
}

export function bindEditablePopup(featureEntry) {
  const marker = featureEntry.marker;

  //TODO: Make so the user can define  the properties of the geojson
  const createPopupContent = () => `
    <form class="marker-form">
      <label>Name</label><br>
      <input type="text" name="name" value="${featureEntry.props.name || ''}" placeholder="Enter name"><br>
      <label>Description</label><br>
      <input type="text" name="description" value="${featureEntry.props.description || ''}" placeholder="Enter description"><br>
      <label>Icon</label><br>
      <button type="button" class="icon-picker-btn"><i class="fa-solid fa-image"></i> Choose Icon</button>
      <span class="selected-icon">${featureEntry.props.icon || 'point'}</span><br>
      <button type="submit"><i class="fa-solid fa-check"></i> Save</button>
    </form>
  `;

  marker.bindPopup(createPopupContent());

  marker.on('popupopen', () => {

    marker.setPopupContent(createPopupContent());

    const popupElement = marker.getPopup().getElement();
    const form = popupElement.querySelector('.marker-form');
    const iconBtn = form.querySelector('.icon-picker-btn');

    iconBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showIconPicker(featureEntry, form, icons);
    });

    form.addEventListener('submit', async e => {
      e.preventDefault();

      featureEntry.props.name = form.elements['name'].value;
      featureEntry.props.description = form.elements['description'].value;
      updateMarkerIcon(marker, featureEntry.props.icon);
      
      if (currentDatasetId !== null) {
        const geoData = prepareFeatureChanges(currentDatasetId);
        await updateGeoJSONToDatabase(geoData, currentDatasetId);
      }

      marker.closePopup();
    });
  });
}

function updateMarkerIcon(marker, iconName) {
  const newIcon = icons[iconName] || icons.point;
  marker.setIcon(newIcon);
}
