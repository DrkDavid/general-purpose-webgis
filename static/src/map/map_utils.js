import { map, icons } from "./map_setup.js";

export function clearLayers(map, layers) {
  if (layers.permanentLine) map.removeLayer(layers.permanentLine);
  layers.forEach(layer => map.removeLayer(layer));
  layers.length = 0;
}

export function createGeoJSON(type, coordinates, props = {}) {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {
          name: props.name || "Unnamed",
          description: props.description || ""
        },
        geometry: {
          type,
          coordinates
        }
      }
    ]
  };
}

export function displayVectorData(geoData) {
  const geoLayer = L.geoJSON(geoData, {
    style: () => ({
      color: '#3388ff',
      weight: 2,
      fillOpacity: 0.5
    }),
    pointToLayer: (_, latlng) => L.marker(latlng, { icon: icons.point }),
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
  geoLayer.addTo(map);
  map.fitBounds(geoLayer.getBounds());
  return geoLayer;
}

export function removeLayers(layerDictionary) {
  layerDictionary.forEach (function(value, key) {
  map.removeLayer(value);
  })
  layerDictionary.clear()
}

export function removeLayerById(layerDictionary, id){
  if (layerDictionary.has(id)) {
    map.removeLayer(layerDictionary.get(id));
  }
}
