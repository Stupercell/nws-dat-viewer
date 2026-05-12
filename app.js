// ======================
// CREATE MAP
// ======================

const map = L.map('map').setView([39.5, -98.35], 4);

// ======================
// BASEMAPS
// ======================

const darkMap = L.tileLayer(
  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
  }
).addTo(map);

const satelliteMap = L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  {
    attribution: 'Tiles &copy; Esri'
  }
);

const lightMap = L.tileLayer(
  'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
  }
);

const terrainMap = L.tileLayer(
  'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
  {
    attribution: '&copy; OpenTopoMap contributors'
  }
);

const baseMaps = {
  "Dark": darkMap,
  "Satellite": satelliteMap,
  "Light": lightMap,
  "Terrain": terrainMap
};

// ======================
// OVERLAY CONTROL
// ======================

const overlayMaps = {};

const layerControl =
  L.control.layers(
    baseMaps,
    overlayMaps
  ).addTo(map);

// ======================
// GLOBAL LAYERS
// ======================

let tornadoLayer;
let damagePointLayer;

// ======================
// STATES
// ======================

const states = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"
];

const stateSelect =
  document.getElementById("stateFilter");

states.forEach(state => {

  const option =
    document.createElement("option");

  option.value = state;
  option.textContent = state;

  stateSelect.appendChild(option);

});

// ======================
// EF FILTER
// ======================

const efWrapper =
  document.createElement("div");

efWrapper.className = "filter-group";

const efLabel =
  document.createElement("label");

efLabel.textContent =
  "EF Rating";

const efFilter =
  document.createElement("select");

efFilter.id = "efFilter";

[
  "",
  "EFU",
  "EF0",
  "EF1",
  "EF2",
  "EF3",
  "EF4",
  "EF5"
].forEach(rating => {

  const option =
    document.createElement("option");

  option.value = rating;

  option.textContent =
    rating === ""
      ? "All Ratings"
      : rating;

  efFilter.appendChild(option);

});

efWrapper.appendChild(efLabel);
efWrapper.appendChild(efFilter);

document
  .getElementById("sidebar")
  .insertBefore(
    efWrapper,
    document.getElementById("applyFilters")
  );

// ======================
// EF COLORS
// ======================

function getEFColor(rating) {

  switch (rating) {

    case "EF0":
      return "#22c55e";

    case "EF1":
      return "#eab308";

    case "EF2":
      return "#f97316";

    case "EF3":
      return "#ef4444";

    case "EF4":
      return "#d946ef";

    case "EF5":
      return "#7e22ce";

    default:
      return "#9ca3af";
  }
}

// ======================
// FORMAT DATE
// ======================

function formatDate(dateValue) {

  if (!dateValue) {
    return "N/A";
  }

  try {

    const date =
      new Date(dateValue);

    return date.toLocaleString();

  } catch {

    return "N/A";

  }
}

// ======================
// LOAD SURVEY PHOTOS
// ======================

async function loadSurveyPhotos(objectId) {

  try {

    const attachmentUrl =
      `https://services.dat.noaa.gov/arcgis/rest/services/nws_damageassessmenttoolkit/DamageViewer/FeatureServer/0/${objectId}/attachments?f=json`;

    const response =
      await fetch(attachmentUrl);

    const data =
      await response.json();

    if (
      !data.attachmentInfos ||
      data.attachmentInfos.length === 0
    ) {

      return `
        <p>No survey photos available.</p>
      `;
    }

    let html = `
      <div class="photo-gallery">

        <h3>Survey Photos</h3>

        <div class="photo-grid">
    `;

    data.attachmentInfos.forEach(photo => {

      const imageUrl =
        `https://services.dat.noaa.gov/arcgis/rest/services/nws_damageassessmenttoolkit/DamageViewer/FeatureServer/0/${objectId}/attachments/${photo.id}`;

      html += `
        <img
          src="${imageUrl}"
          alt="Survey Photo"
          onclick="window.open('${imageUrl}')"
        >
      `;
    });

    html += `
        </div>
      </div>
    `;

    return html;

  } catch (error) {

    console.error(
      "Error loading survey photos:",
      error
    );

    return `
      <p>Error loading photos.</p>
    `;
  }
}

// ======================
// TORNADO DETAILS PANEL
// ======================

async function showTornadoDetails(props) {

  const panel =
    document.getElementById(
      "detailsPanel"
    );

  const content =
    document.getElementById(
      "detailsContent"
    );

  panel.classList.remove(
    "hidden"
  );

  const photoHtml =
    await loadSurveyPhotos(
      props.OBJECTID
    );

  content.innerHTML = `

    <div
      class="detail-header"
      style="
        background:
        ${getEFColor(props.RATING)};
      "
    >

      <h2>
        ${props.RATING || 'EFU'}
      </h2>

      <div>
        ${props.EVENT_ID || 'Unknown Event'}
      </div>

    </div>

    <div class="detail-grid">

      <div class="detail-card">

        <div class="detail-card-label">
          State
        </div>

        <div class="detail-card-value">
          ${props.STATE || 'N/A'}
        </div>

      </div>

      <div class="detail-card">

        <div class="detail-card-label">
          Injuries
        </div>

        <div class="detail-card-value">
          ${props.INJURIES || 0}
        </div>

      </div>

      <div class="detail-card">

        <div class="detail-card-label">
          Fatalities
        </div>

        <div class="detail-card-value">
          ${props.FATALITIES || 0}
        </div>

      </div>

      <div class="detail-card">

        <div class="detail-card-label">
          Begin Date
        </div>

        <div class="detail-card-value">
          ${formatDate(props.BEGIN_DATE)}
        </div>

      </div>

    </div>

    <div class="comment-box">

      <h3>Survey Comments</h3>

      <p>
        ${props.COMMENTS || 'No comments available.'}
      </p>

    </div>

    ${photoHtml}

  `;
}

// ======================
// DAMAGE POINT DETAILS
// ======================

function showDamagePointDetails(props) {

  const panel =
    document.getElementById(
      "detailsPanel"
    );

  const content =
    document.getElementById(
      "detailsContent"
    );

  panel.classList.remove(
    "hidden"
  );

  content.innerHTML = `

    <div
      class="detail-header"
      style="
        background:#0284c7;
      "
    >

      <h2>
        Damage Point
      </h2>

      <div>
        ${props.DI || 'Unknown'}
      </div>

    </div>

    <div class="detail-grid">

      <div class="detail-card">

        <div class="detail-card-label">
          Damage Indicator
        </div>

        <div class="detail-card-value">
          ${props.DI || 'N/A'}
        </div>

      </div>

      <div class="detail-card">

        <div class="detail-card-label">
          Degree of Damage
        </div>

        <div class="detail-card-value">
          ${props.DOD || 'N/A'}
        </div>

      </div>

      <div class="detail-card">

        <div class="detail-card-label">
          Estimated Wind
        </div>

        <div class="detail-card-value">
          ${props.ESTIMATED_WIND || 'N/A'}
        </div>

      </div>

      <div class="detail-card">

        <div class="detail-card-label">
          State
        </div>

        <div class="detail-card-value">
          ${props.STATE || 'N/A'}
        </div>

      </div>

    </div>

  `;
}

// ======================
// LOAD TORNADO DATA
// ======================

async function loadTornadoData() {

  try {

    const state =
      document.getElementById(
        "stateFilter"
      ).value;

    const ef =
      document.getElementById(
        "efFilter"
      ).value;

    let where = "1=1";

    if (state) {
      where += ` AND STATE='${state}'`;
    }

    if (ef) {
      where += ` AND RATING='${ef}'`;
    }

    const url =
      `https://services.dat.noaa.gov/arcgis/rest/services/nws_damageassessmenttoolkit/DamageViewer/FeatureServer/0/query?where=${encodeURIComponent(where)}&outFields=*&f=geojson`;

    const response =
      await fetch(url);

    const data =
      await response.json();

    if (tornadoLayer) {

      map.removeLayer(
        tornadoLayer
      );

    }

    tornadoLayer =
      L.geoJSON(data, {

        style: function(feature) {

          return {

            color: getEFColor(
              feature.properties.RATING
            ),

            weight: 3

          };
        },

        onEachFeature:
          function(feature, layer) {

          layer.on(
            "click",
            async () => {

              await showTornadoDetails(
                feature.properties
              );

            }
          );
        }

      }).addTo(map);

    if (
      !overlayMaps["Tornado Paths"]
    ) {

      overlayMaps[
        "Tornado Paths"
      ] = tornadoLayer;

      layerControl.addOverlay(
        tornadoLayer,
        "Tornado Paths"
      );
    }

    if (
      tornadoLayer.getBounds().isValid()
    ) {

      map.fitBounds(
        tornadoLayer.getBounds()
      );

    }

  } catch (error) {

    console.error(
      "Error loading tornado data:",
      error
    );
  }
}

// ======================
// LOAD DAMAGE POINTS
// ======================

async function loadDamagePoints() {

  try {

    const url =
      `https://services.dat.noaa.gov/arcgis/rest/services/nws_damageassessmenttoolkit/DamageViewer/FeatureServer/1/query?where=1%3D1&outFields=*&f=geojson`;

    const response =
      await fetch(url);

    const data =
      await response.json();

    if (damagePointLayer) {

      map.removeLayer(
        damagePointLayer
      );

    }

    damagePointLayer =
      L.geoJSON(data, {

        pointToLayer:
          function(feature, latlng) {

          return L.circleMarker(
            latlng,
            {
              radius: 5,
              fillColor: "#38bdf8",
              color: "#ffffff",
              weight: 1,
              opacity: 1,
              fillOpacity: 0.9
            }
          );
        },

        onEachFeature:
          function(feature, layer) {

          layer.on(
            "click",
            () => {

              showDamagePointDetails(
                feature.properties
              );

            }
          );
        }

      }).addTo(map);

    if (
      !overlayMaps["Damage Points"]
    ) {

      overlayMaps[
        "Damage Points"
      ] = damagePointLayer;

      layerControl.addOverlay(
        damagePointLayer,
        "Damage Points"
      );
    }

  } catch (error) {

    console.error(
      "Error loading damage points:",
      error
    );
  }
}

// ======================
// FILTER BUTTON
// ======================

document
  .getElementById(
    "applyFilters"
  )
  .addEventListener(
    "click",
    loadTornadoData
  );

// ======================
// CLOSE PANEL
// ======================

document
  .getElementById(
    "closePanel"
  )
  .addEventListener(
    "click",
    () => {

      document
        .getElementById(
          "detailsPanel"
        )
        .classList.add(
          "hidden"
        );

    }
  );

// ======================
// INITIAL LOAD
// ======================

loadTornadoData();
loadDamagePoints();
