// Create map
const map = L.map('map').setView([39.5, -98.35], 4);

// Dark basemap
L.tileLayer(
  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
  }
).addTo(map);

// NOAA DAT GeoJSON endpoint
const tornadoLayerUrl =
  'https://services.dat.noaa.gov/arcgis/rest/services/nws_damageassessmenttoolkit/DamageViewer/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson';

// Layer group
let tornadoLayer;

// Load tornado data
async function loadTornadoData() {
  try {
    const response = await fetch(tornadoLayerUrl);
    const data = await response.json();

    // Remove old layer
    if (tornadoLayer) {
      map.removeLayer(tornadoLayer);
    }

    tornadoLayer = L.geoJSON(data, {
      style: {
        color: '#ff3b3b',
        weight: 2
      },

      onEachFeature: function (feature, layer) {

        const props = feature.properties;

        layer.bindPopup(`
          <strong>${props.EVENT_ID || 'Unknown Event'}</strong><br>
          Rating: ${props.RATING || 'N/A'}<br>
          State: ${props.STATE || 'N/A'}<br>
          Injuries: ${props.INJURIES || 0}<br>
          Fatalities: ${props.FATALITIES || 0}
        `);
      }
    }).addTo(map);

    map.fitBounds(tornadoLayer.getBounds());

  } catch (error) {
    console.error('Error loading NOAA DAT data:', error);
  }
}

// Load immediately
loadTornadoData();
