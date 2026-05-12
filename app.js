// ======================
// LOADING SCREEN
// ======================

function showLoading() {

  document
    .getElementById("loadingScreen")
    .classList.remove("hidden");

}

function hideLoading() {

  document
    .getElementById("loadingScreen")
    .classList.add("hidden");

}

// ======================
// CREATE MAP
// ======================

const map =
  L.map('map').setView(
    [39.5, -98.35],
    4
  );

// ======================
// BASEMAPS
// ======================

const darkMap =
  L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    {
      attribution:
        '&copy; OpenStreetMap contributors &copy; CARTO'
    }
  ).addTo(map);

const satelliteMap =
  L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {
      attribution: 'Tiles &copy; Esri'
    }
  );

const lightMap =
  L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    {
      attribution:
        '&copy; OpenStreetMap contributors &copy; CARTO'
    }
  );

const terrainMap =
  L.tileLayer(
    'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    {
      attribution:
        '&copy; OpenTopoMap contributors'
    }
  );

const baseMaps = {
  "Dark": darkMap,
  "Satellite": satelliteMap,
  "Light": lightMap,
  "Terrain": terrainMap
};

// ======================
// OVERLAYS
// ======================

const overlayMaps = {};

const layerControl =
  L.control.layers(
    baseMaps,
    overlayMaps
  ).addTo(map);

// ======================
// LAYERS
// ======================

let tornadoLayer;
let damagePointLayer;
let polygonLayer;

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
  document.getElementById(
    "stateFilter"
  );

states.forEach(state => {

  const option =
    document.createElement(
      "option"
    );

  option.value = state;
  option.textContent = state;

  stateSelect.appendChild(
    option
  );

});

// ======================
// EF FILTER
// ======================

const efWrapper =
  document.createElement("div");

efWrapper.className =
  "filter-group";

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
    document.createElement(
      "option"
    );

  option.value = rating;

  option.textContent =
    rating === ""
      ? "All Ratings"
      : rating;

  efFilter.appendChild(
    option
  );

});

efWrapper.appendChild(
  efLabel
);

efWrapper.appendChild(
  efFilter
);

document
  .getElementById("sidebar")
  .insertBefore(
    efWrapper,
    document.getElementById(
      "applyFilters"
    )
  );

// ======================
// EF COLORS
// ======================

function getEFColor(rating) {

  switch (rating) {

    case "EF0":
      return "#00ff00";

    case "EF1":
      return "#ffff00";

    case "EF2":
      return "#ff9900";

    case "EF3":
      return "#ff0000";

    case "EF4":
      return "#ff00ff";

    case "EF5":
      return "#800080";

    default:
      return "#9ca3af";
  }
}

// ======================
// LIGHTBOX
// ======================

function openLightbox(imageUrl) {

  const lightbox =
    document.getElementById(
      "lightbox"
    );

  const image =
    document.getElementById(
      "lightboxImage"
    );

  image.src = imageUrl;

  lightbox.classList.remove(
    "hidden"
  );

}

document
  .getElementById(
    "closeLightbox"
  )
  .addEventListener(
    "click",
    () => {

      document
        .getElementById(
          "lightbox"
        )
        .classList.add(
          "hidden"
        );

    }
  );

// ======================
// DATE FORMAT
// ======================

function formatDate(value) {

  if (!value) {
    return "N/A";
  }

  try {

    return new Date(
      value
    ).toLocaleString();

  } catch {

    return "N/A";

  }
}

// ======================
// SURVEY PHOTOS
// ======================

async function loadSurveyPhotos(
  objectId
) {

  try {

    const attachmentUrl =
      `https://services.dat.noaa.gov/arcgis/rest/services/nws_damageassessmenttoolkit/DamageViewer/FeatureServer/0/${objectId}/attachments?f=json`;

    const response =
      await fetch(
        attachmentUrl
      );

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

    data.attachmentInfos.forEach(
      photo => {

        const imageUrl =
          `https://services.dat.noaa.gov/arcgis/rest/services/nws_damageassessmenttoolkit/DamageViewer/FeatureServer/0/${objectId}/attachments/${photo.id}`;

        html += `
          <img
            src="${imageUrl}"
            onclick="openLightbox('${imageUrl}')"
          >
        `;
      }
    );

    html += `
        </div>
      </div>
    `;

    return html;

  } catch {

    return `
      <p>Error loading photos.</p>
    `;
  }
}

// ======================
// STATS
// ======================

function updateStats(features) {

  document
    .getElementById(
      "statTotal"
    )
    .textContent =
      features.length;

  const ratings =
    features.map(
      f => f.properties.RATING
    );

  const order =
    [
      "EFU",
      "EF0",
      "EF1",
      "EF2",
      "EF3",
      "EF4",
      "EF5"
    ];

  let strongest = "N/A";

  order.forEach(r => {

    if (ratings.includes(r)) {
      strongest = r;
    }

  });

  document
    .getElementById(
      "statStrongest"
    )
    .textContent =
      strongest;

  const states =
    new Set(
      features.map(
        f => f.properties.STATE
      )
    );

  document
    .getElementById(
      "statStates"
    )
    .textContent =
      states.size;

}

// ======================
// DETAILS PANEL
// ======================

async function showTornadoDetails(
  props
) {

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
// DAMAGE DETAILS
// ======================

function showDamagePointDetails(
  props
) {

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

    </div>

  `;

}

// ======================
// LOAD TORNADOES
// ======================

async function loadTornadoData() {

  showLoading();

  try {

    const state =
      document
        .getElementById(
          "stateFilter"
        )
        .value;

    const ef =
      document
        .getElementById(
          "efFilter"
        )
        .value;

    const search =
      document
        .getElementById(
          "searchInput"
        )
        .value
        .trim();

    const startDate =
      document
        .getElementById(
          "startDate"
        )
        .value;

    const endDate =
      document
        .getElementById(
          "endDate"
        )
        .value;

    let where = "1=1";

    if (state) {
      where += `
        AND STATE='${state}'
      `;
    }

    if (ef) {
      where += `
        AND RATING='${ef}'
      `;
    }

    if (search) {

      where += `
        AND (
          EVENT_ID LIKE '%${search}%'
          OR COMMENTS LIKE '%${search}%'
        )
      `;
    }

    if (
      startDate &&
      endDate
    ) {

      where += `
        AND BEGIN_DATE >= DATE '${startDate}'
        AND BEGIN_DATE <= DATE '${endDate}'
      `;
    }

    const bounds =
      map.getBounds();

    const geometry =
      `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;

    const url =
      `https://services.dat.noaa.gov/arcgis/rest/services/nws_damageassessmenttoolkit/DamageViewer/FeatureServer/0/query?where=${encodeURIComponent(where)}&geometry=${geometry}&geometryType=esriGeometryEnvelope&spatialRel=esriSpatialRelIntersects&outFields=*&f=geojson`;

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

        style: feature => ({

          color:
            getEFColor(
              feature.properties.RATING
            ),

          weight: 3,

          opacity: 0.9

        }),

        onEachFeature:
          (feature, layer) => {

            layer.on(
              "mouseover",
              () => {

                layer.setStyle({
                  weight: 5
                });

              }
            );

            layer.on(
              "mouseout",
              () => {

                layer.setStyle({
                  weight: 3
                });

              }
            );

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

    updateStats(
      data.features
    );

    if (
      !overlayMaps[
        "Tornado Paths"
      ]
    ) {

      overlayMaps[
        "Tornado Paths"
      ] = tornadoLayer;

      layerControl.addOverlay(
        tornadoLayer,
        "Tornado Paths"
      );

    }

  } catch (error) {

    console.error(error);

  }

  hideLoading();

}

// ======================
// DAMAGE POINTS
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
          (feature, latlng) => {

            return L.circleMarker(
              latlng,
              {
                radius: 5,
                fillColor: "#00ffff",
                color: "#ffffff",
                weight: 1,
                fillOpacity: 0.9
              }
            );

          },

        onEachFeature:
          (feature, layer) => {

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
      !overlayMaps[
        "Damage Points"
      ]
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

    console.error(error);

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
// QUICK FILTERS
// ======================

document
  .querySelectorAll(
    ".quickFilterBtn"
  )
  .forEach(btn => {

    btn.addEventListener(
      "click",
      () => {

        const days =
          parseInt(
            btn.dataset.days
          );

        const end =
          new Date();

        const start =
          new Date();

        start.setDate(
          end.getDate() - days
        );

        document
          .getElementById(
            "startDate"
          )
          .value =
            start
              .toISOString()
              .split("T")[0];

        document
          .getElementById(
            "endDate"
          )
          .value =
            end
              .toISOString()
              .split("T")[0];

      }
    );

  });

// ======================
// MOBILE SIDEBAR
// ======================

document
  .getElementById(
    "mobileFilterToggle"
  )
  .addEventListener(
    "click",
    () => {

      document
        .getElementById(
          "sidebar"
        )
        .classList.toggle(
          "mobile-open"
        );

    }
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
// RELOAD ON MAP MOVE
// ======================

map.on(
  "moveend",
  () => {

    loadTornadoData();

  }
);

// ======================
// INITIAL LOAD
// ======================

loadTornadoData();
loadDamagePoints();
