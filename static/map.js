export const dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution: '© OpenStreetMap contributors'
});

export const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
});

export const map = L.map('map', {
  center: [48.379, 31.165],
  zoom: 7,
  layers: [dark]
});

const baseMaps = {
  "CartoDB Dark Matter" : dark,
  "OpenStreetMap": osm,
};

L.control.layers(baseMaps).addTo(map);

export function removeLayer(layerDictionary, id){
  if (layerDictionary.has(id)) {
    map.removeLayer(layerDictionary.get(id));
  }
}

export function displayVectorData(geoData, datasetId = 0) {
  
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

  return geoLayer
}