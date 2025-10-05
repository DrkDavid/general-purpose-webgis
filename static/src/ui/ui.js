import { displayVectorData,
  removeLayerById,
  removeLayers
 } from "../map/map_utils.js";

import { saveGeoJSONToDatabase, 
  loadDatasetsList, 
  removeDatasetById, 
  loadDatasetById } from "../data/data_manager.js";

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
  removeLayers(layerDictionary);
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

        removeLayerById(layerDictionary, id)

        const geoLayer = displayVectorData(geoData);  

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
    alert('Error reading file');
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
    alert(`Could not update datasets list. Error : ${error}`)
  }

}

function displayDatasetsList(datasets) {

  try {

    if (datasets.length == 0) {
      datasetsList.innerHTML = '<p class="loading">No saved datasets</p>';
      return;
    }

    datasetsList.innerHTML = '';

    datasets.forEach(dataset => {

      const datasetContainerDiv = document.createElement('div');
      const datasetDiv = document.createElement('div');
      const deleteDiv = document.createElement('div');

      datasetContainerDiv.className = 'dataset-container'
      datasetDiv.className = 'dataset-item';
      datasetDiv.dataset.id = dataset.id;

      if (currentDatasetId == dataset.id) {
        datasetDiv.classList.add('active');
      }

      datasetDiv.innerHTML = `
        <div class="dataset-name">${dataset.name}</div>
        <div class="dataset-meta">
          ${dataset.geometry_types} | ${dataset.feature_count} features<br>
          ${new Date(dataset.upload_date).toLocaleDateString()}
        </div>
      `;

      deleteDiv.innerHTML = `      
        <button><i class="fa fa-close"></i></button>`;

      datasetDiv.addEventListener('click', async function() {
        const geoData = await loadDatasetById(dataset.id, dataset.name);
        removeLayerById(layerDictionary, dataset.id)
        const geoLayer = displayVectorData(geoData);  
        updateDatasetsList(dataset.id, geoLayer);
      });

      deleteDiv.addEventListener('click', async function() {
        const removedId = await removeDatasetById(dataset.id, datasetContainerDiv);
        removeLayerById(layerDictionary, removedId)
        layerDictionary.delete(removedId)
        datasetContainerDiv.remove()
      });

      datasetContainerDiv.appendChild(datasetDiv)
      datasetContainerDiv.appendChild(deleteDiv)
      datasetsList.appendChild(datasetContainerDiv);

    });
  }
  catch (error) {
    alert(`Error while displaying datasets. Error : ${error}`)
  }
}