import { showNotification } from "../utils/notifications.js";

export function prepareGeoJSONForDownload(geoData) {
  try {
    const geoJSONString = JSON.stringify(geoData, null, 2);
    const blob = new Blob([geoJSONString], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    return url;
  }
  catch (error) {
    showNotification(`Error preparing file download`, 'error')
    return 0;
  }
}

export async function saveGeoJSONToDatabase(geoData, filename) {

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
      return result.id;
    }
    else {
      showNotification(`Error saving: ${result.error}`, 'error');
      return 0;
    }
  }
  catch (error) {
    showNotification(`Network error while saving`, 'error')
    return 0;
  }
}

export async function updateGeoJSONToDatabase(geoData, datasetId) {
  try {
    const response = await fetch('/api/update-dataset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: datasetId,
      data: geoData
    })
  });

  const result = await response.json();
  if (response.ok) {
    showNotification(`${result.message}`, 'success');
    return result.id;
  }
  else {
      showNotification(`Error updating: ${result.error}`, 'error');
      return 0;
    }
  }
  catch (error) {
    showNotification(`Network error while updating data`, 'error')
    return 0;
  }
}

export async function loadDatasetsList(datasetsList) {
  datasetsList.innerHTML = '<p class="loading">Loading datasets...</p>';

  try {
    const response = await fetch('/api/get-datasets');
    const datasets = await response.json();
    if (response.ok) {
      return datasets; 
    }
    else {
      datasetsList.innerHTML = `<p class="loading">Error: ${datasets.error}</p>`;
      return null;
    }
  }
  catch (error) {
    datasetsList.innerHTML = '<p class="loading">Error loading datasets</p>';
    return null;
  }
}

export async function loadDatasetById(datasetId) {

  try {
    const response = await fetch(`/api/get-dataset/${datasetId}`);
    const geoData = await response.json();

    if (response.ok) { 
      showNotification(`Loaded dataset id ${datasetId}`, 'info')
      return geoData;
    }
    else {
      showNotification(`Error loading dataset: ${geoData.error}`, 'error');
      return null;
    }
  }
  catch (error) {
    showNotification('Network error loading dataset', 'error');
    return null;
  }
}

export async function removeDatasetById(datasetId) {

  try {

    const response = await fetch(`/api/remove-dataset/${datasetId}`)
    const outcome = await response.json();
    
    if (response.ok) {
      showNotification(`Dataset removed`, 'info')
      return datasetId
    }
    else {
      showNotification(`Error removing dataset: ${outcome.error}`, 'error');
      return 0
    }

  }
  catch (error) {
    showNotification('Network error removing dataset', 'error');
    return 0
  }
}

export async function loadCustomIcons() {
  try {
    const response = await fetch(`/api/icons`);
    const files = await response.json();
    return files;

  } catch (err) {
    showNotification('Network error loading custom icons', 'error');
    return 0;
  }
}