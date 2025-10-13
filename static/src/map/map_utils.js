export function clearLayers(map, layers) {
  if (layers.permanentLine) map.removeLayer(layers.permanentLine);
  layers.forEach(layer => map.removeLayer(layer));
  layers.length = 0;
}

export function resizeMap() {
  setTimeout(() => {
    window.map.invalidateSize();
  }, 150);
}

export function createGeoJSON(type, coordinates, props = {}) {
  if (type === "MultiPoint") {
    return {
      type: "FeatureCollection",
      features: coordinates.map((coord, i) => ({
        type: "Feature",
        properties: props[i] || {},
        geometry: {
          type: "Point",
          coordinates: coord
        }
      }))
    };
  }

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: props,
        geometry: {
          type,
          coordinates
        }
      }
    ]
  };
}

export function displayVectorData(geoData, datasetId, options = {}) {

  const { bindPopupFn = null, onDatasetLoaded = null, map = null, icons = null} = options;

  const geoLayer = L.geoJSON(geoData, {
    style: () => ({
      color: '#3388ff',
      weight: 2,
      fillOpacity: 0.5
    }),
    pointToLayer: (feature, latlng) =>{  
      const iconName = feature.properties?.icon || 'point';
      const icon = icons[iconName] || icons.point;
      const marker = L.marker(latlng, { icon: icon });

      var featureEntry = { marker, latlng, props: feature.properties };

      marker.options.featureEntry = featureEntry;
      
      if (bindPopupFn) bindPopupFn(featureEntry);
      
      return marker;
    },
    onEachFeature: (feature, layer) => {
      if (feature.properties) {
        let content = '<div>';
        for (let key in feature.properties)
          content += `<strong>${key}:</strong> ${feature.properties[key]}<br>`;
        content += '</div>';
        layer.bindPopup(content);
      }
    }
  });

  if (map) {
    geoLayer.addTo(map);
    map.fitBounds(geoLayer.getBounds());
  }

  if (onDatasetLoaded && datasetId !== null) {
    onDatasetLoaded(datasetId);
  }
  
  return geoLayer;
}

export function removeLayers(layerDictionary, options = {}) {
  const { map = null } = options;
  layerDictionary.forEach (function(value, key) {
  map.removeLayer(value);
  })
  layerDictionary.clear()
}

export function removeLayerById(layerDictionary, id, options = {}){
  const { map = null } = options;
  if (layerDictionary.has(id)) {
    map.removeLayer(layerDictionary.get(id));
  }
}

export function prepareFeatureChanges() {
  const allFeatures = [];
  
  map.eachLayer(layer => {
    if (layer instanceof L.Marker) {

      const feature = {
        type: "Feature",
        properties: layer.options.featureEntry?.props || {},
        geometry: {
          type: "Point",
          coordinates: [layer.getLatLng().lng, layer.getLatLng().lat]
        }
      };
      allFeatures.push(feature);
    }
  });

  const geoData = {
    type: "FeatureCollection",
    features: allFeatures
  };

  return geoData
}
