import { displayVectorData,
  removeLayerById,
  removeLayers
 } from "../map/map_utils.js";

import { saveGeoJSONToDatabase, 
  loadDatasetsList, 
  removeDatasetById, 
  loadDatasetById,
  prepareGeoJSONForDownload } from "../data/data_manager.js";

import { bindEditablePopup, setCurrentDatasetId } from "../map/drawing_tools.js";
import { map, icons } from "../map/map_setup.js";

const fileInput = document.getElementById('vector-file');
const loadButton = document.getElementById('vector-file');
const refreshDatasetsBtn = document.getElementById('refresh-datasets-btn')
const datasetsList = document.getElementById('datasets-list')

let currentDatasetId = null;
let layerDictionary = new Map();

fileInput.addEventListener('click', () => {
  fileInput.value = "";
});

loadButton.addEventListener('change', function() {
  const file = fileInput.files[0];
  if (file) {
    uploadVectorFile(file);
  }
});

refreshDatasetsBtn.addEventListener('click', async function() {
  const datasets = await loadDatasetsList(datasetsList);
  displayDatasetsList(datasets);
  removeLayers(layerDictionary, { map : map});
});

datasetsList.addEventListener('click', async e => {
  const target = e.target.closest('button, .dataset-item');
  if (!target) return;

  const container = target.closest('.dataset-container-h');
  const id = container.dataset.id;
  const name = container.dataset.name;

  if (target.classList.contains('btn-download')) {
    const geoData = await loadDatasetById(id);
    const url = prepareGeoJSONForDownload(geoData);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  } 
  else if (target.classList.contains('btn-delete')) {
    const removedId = await removeDatasetById(id, container);
    removeLayerById(layerDictionary, removedId, {map : map});
    layerDictionary.delete(removedId);
    container.remove();
  } 
  else if (target.classList.contains('dataset-item')) {
    const geoData = await loadDatasetById(id);
    removeLayerById(layerDictionary, id, {map : map});
    const geoLayer = displayVectorData(geoData, id, { bindPopupFn: bindEditablePopup, onDatasetLoaded: setCurrentDatasetId, map : map, icons : icons});
    updateDatasetsList(id, geoLayer);

    if (currentDatasetId == id) {
      target.classList.add('active');
    }
  }
});

window.addEventListener('load', async function() {
  const datasets = await loadDatasetsList(datasetsList);
  displayDatasetsList(datasets);
});

function uploadVectorFile(file) {

  const reader = new FileReader();

  reader.onload = async function(e) {
    const fileContent = e.target.result;

    try {
      const geoData = JSON.parse(fileContent);

      if (geoData.type && (geoData.type == 'FeatureCollection' || geoData.type == 'Feature' || geoData.type == 'GeometryCollection')) {
        
        const filename = fileInput.files[0].name;
        const id = await saveGeoJSONToDatabase(geoData, filename);
        const datasets = await loadDatasetsList(datasetsList);

        displayDatasetsList(datasets);

        removeLayerById(layerDictionary, id, {map : map})

        const geoLayer = displayVectorData(geoData, id, { bindPopupFn: bindEditablePopup, onDatasetLoaded: setCurrentDatasetId, map : map, icons : icons});  

        updateDatasetsList(id, geoLayer);
      }
      else {
        alert('Invalid GeoJSON file structure');
      }
    }
    catch (error) {
      alert(`Could not parse file as GeoJSON. Please check the file format. Error : ${error}`)
    }
  };

  reader.onerror = function() {
    alert('Error. Could not read file');
  };

  reader.readAsText(file);
};

export async function refreshDatasetsList() {
  const datasets = await loadDatasetsList(datasetsList);
  displayDatasetsList(datasets);
}

function updateDatasetsList(id, geoLayer) {
  try {
    layerDictionary.set(id, geoLayer);
    currentDatasetId = id;

    document.querySelectorAll('.dataset-item').forEach(item => {
      item.classList.remove('active');
    });
    document.querySelector(`[data-id="${id}"]`)?.classList.add('active'); 
  } 
  catch (error) {
    alert(`Error. Could not update datasets list:\n${error}`)
  }

}

function createDatasetCard(dataset) {
  try {
    const wrapper = document.createElement('div');
    wrapper.dataset.id = dataset.id;
    wrapper.dataset.name = dataset.name;
    wrapper.className = 'dataset-container-h';

    const datasetDiv = document.createElement('div');
    datasetDiv.className = 'dataset-item';
    datasetDiv.dataset.id = dataset.id;
    datasetDiv.innerHTML = `
      <div class="dataset-name">${dataset.name}</div>
      <div class="dataset-meta">
        ${dataset.geometry_types} | ${dataset.feature_count} features<br>
        ${new Date(dataset.upload_date).toLocaleDateString()}
      </div>
    `;

    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'dataset-container-v';
    buttonsContainer.innerHTML = `
      <button class="btn-download" title="Download"><i class="fa-solid fa-download"></i></button>
      <button class="btn-delete" title="Delete"><i class="fa fa-close"></i></button>
    `;

    wrapper.append(datasetDiv, buttonsContainer);
    return wrapper;
  }
  catch (error) {
    alert(`Error. Could not create dataset card:\n${error}`)
  }

}

function displayDatasetsList(datasets) {
  try {
    datasetsList.innerHTML = '';

    if (datasets.length === 0) {
      datasetsList.innerHTML = '<p class="loading">No saved datasets</p>';
      return;
    }

    const fragment = document.createDocumentFragment();
    datasets.forEach(dataset => fragment.appendChild(createDatasetCard(dataset)));
    datasetsList.appendChild(fragment);
  } catch (error) {
    alert(`Error while displaying datasets:\n${error}`);
  }
}

export function showIconPicker(featureEntry, form, icons) {
  const pickerHTML = `
    <div class="icon-picker-modal">
      <div class="icon-picker-content">
        <button class="icon-picker-close" title="Close"><i class="fa fa-close"></i></button>
        ${Object.keys(icons).map(iconName => `
          <div class="icon-option" data-icon="${iconName}" title="${iconName}">
            <img src="${icons[iconName].options.iconUrl}" alt="${iconName}">
            <p>${iconName}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  const modal = document.createElement('div');
  modal.innerHTML = pickerHTML;
  document.body.appendChild(modal);

  modal.querySelector('.icon-picker-close').addEventListener('click', () => {
    document.body.removeChild(modal);
  });

  modal.addEventListener('click', (e) => {
    if (e.target.classList.contains('icon-picker-modal')) {
      document.body.removeChild(modal);
    }
  });

  modal.querySelectorAll('.icon-option').forEach(option => {
    option.addEventListener('click', () => {
      featureEntry.props.icon = option.dataset.icon;
      form.querySelector('.selected-icon').textContent = option.dataset.icon;
      document.body.removeChild(modal);
    });
  });
}