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

const fileInput = document.getElementById('vector-file');
const loadButton = document.getElementById('load-file-btn');
const refreshDatasetsBtn = document.getElementById('refresh-datasets-btn')
const datasetsList = document.getElementById('datasets-list')

let currentDatasetId = null;
let currentLayer = null;

fileInput.addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    loadButton.disabled = false;
  }
  else {
    loadButton.disabled = true;
  }
});

loadButton.addEventListener('click', function() {
  const file = fileInput.files[0];
  if (file) {
    loadVectorFile(file);
  }
});

refreshDatasetsBtn.addEventListener('click', function() {
  loadDatasetsList();
});

window.addEventListener('load', function() {
  loadDatasetsList();
});

function loadVectorFile(file) {

  const reader = new FileReader();

  reader.onload = function(e) {
    const fileContent = e.target.result;

    try {
      const geoData = JSON.parse(fileContent);

      if (geoData.type && (geoData.type == 'FeatureCollection' || geoData.type == 'Feature' || geoData.type == 'GeometryCollection')) {
        displayVectorData(geoData, 0);
        const filename = fileInput.files[0].name;
        saveGeoJSONToDatabase(geoData, filename);
      }
      else {
        alert('Invalid GeoJSON file structure');
      }
    }
    catch (error) {
      alert('Could not parse file as GeoJSON. Please check the file format.')
    }
  };

  reader.onerror = function() {
    alert('Error reading file');
  };

  reader.readAsText(file);
};

function displayVectorData(geoData, datasetId = 0) {

  const geoLayer = L.geoJSON(geoData, {
    style : function(feature) {
      return {
        color : '#3388ff',
        weight : 2,
        fillOpacity : 0.5
      };
    },
    onEachFeature : function(feature, layer) {
      if (feature.properties) {
        let popupContent = '<div>';
        for (let key in feature.properties) {
          popupContent += `<strong>${key}:</strong> ${feature.properties[key]}<br>`;
        }
        popupContent += '</div>';
        layer.bindPopup(popupContent);
      }
    }
  });

  geoLayer.addTo(map);

  map.fitBounds(geoLayer.getBounds());

  currentLayer = geoLayer;
  currentDatasetId = datasetId

  document.querySelectorAll('.dataset-item').forEach(item => {
    item.classList.remove('active');
  });
  document.querySelector(`[data-id="${datasetId}"]`)?.classList.add('active');
}

function displayDatasetsList(datasets) {
  if (datasets.length == 0) {
    datasetsList.innerHTML = '<p class="loading">No saved datasets</p>';
    return;
  }

  datasetsList.innerHTML = '';

  datasets.forEach(dataset => {
    const datasetDiv = document.createElement('div');
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

    datasetDiv.addEventListener('click', function() {
      loadDatasetById(dataset.id, dataset.name);
    });

    datasetsList.appendChild(datasetDiv);
  });
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification)
    }
  }, 500);
}

async function saveGeoJSONToDatabase(geoData, filename) {

  try {
    const response = await fetch('/api/save-dataset', {
      method : 'POST',
      headers : {
        'Content-Type' : 'application/json',
      },
      body : JSON.stringify({
        data : geoData,
        filename : filename,
        name : filename.replace(/\.[^/.]+$/, ""),
        description: `Uploaded on ${new Date().toLocaleDateString()}`
      })
    });

    const result = await response.json();

    if (response.ok) {
      showNotification(`${result.message}`, 'success');
      loadDatasetsList();
    }
    else {
      showNotification(`Error saving: ${result.error}`, 'error');
    }
  }
  catch (error) {
    showNotification(`Network error while saving`, 'error')
  }
}

async function loadDatasetsList() {
  datasetsList.innerHTML = '<p class="loading">Loading datasets...</p>';

  try {
    const response = await fetch('/api/get-datasets');
    const datasets = await response.json();

    if (response.ok) {
      displayDatasetsList(datasets);
    }
    else {
      datasetsList.innerHTML = `<p class="loading">Error: ${datasets.error}</p>`;
    }
  }
  catch (error) {
    datasetsList.innerHTML = '<p class="loading">Error loading datasets</p>';
  }
}

async function loadDatasetById(datasetId, datasetName) {

  try {
    const response = await fetch(`/api/get-dataset/${datasetId}`);
    const geoData = await response.json();

    if (response.ok) {
      if (currentLayer) {
        map.removeLayer(currentLayer);
      }

      displayVectorData(geoData, datasetId);
      showNotification(`Loaded "${datasetName}"`, 'info')
    }
    else {
      showNotification(`Error loading dataset: ${geoData.error}`, 'error');
    }
  }
  catch (error) {
    showNotification('Network error loading dataset', 'error');
  }
}





