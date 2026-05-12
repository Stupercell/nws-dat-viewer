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

const baseMaps = {
  "Dark": darkMap,
  "Satellite": satelliteMap
};

L.control.layers(baseMaps).addTo(map);

// ======================
// GLOBAL LAYER
// ======================

let tornadoLayer;

// ======================
// STATE LIST
// ======================

const states = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"
];

const stateSelect = document.getElementById("stateFilter");

states.forEach(state => {
  const option = document.createElement("option");
  option.value = state;
  option.textContent = state;
  stateSelect.appendChild(option);
});

// ======================
// EF FILTER DROPDOWN
// ======================

const efFilter = document.createElement("select");
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

  const option = document.createElement("option");

  option.value = rating;

  option.textContent =
    rating === "" ? "All Ratings" : rating;

  efFilter.appendChild(option);
});

document
  .getElementById("sidebar")
  .insertBefore(
    efFilter,
    document.getElementById("applyFilters")
  );

// ======================
// GET COLOR BY EF
// ======================

function getEFColor(rating) {

// ======================
// LOAD NOAA PHOTOS
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
      "Error loading photos:",
      error
    );

    return `
      <p>Error loading photos.</p>
    `;
  }
}

// ======================
// LOAD TORNADO DATA
// ======================

async function loadTornadoData() {

  try {

    // ======================
    // GET FILTER VALUES
    // ======================

    const startDate =
      document.getElementById("startDate").value;

    const endDate =
      document.getElementById("endDate").value;

    const state =
      document.getElementById("stateFilter").value;

    const ef =
      document.getElementById("efFilter").value;

    // ======================
    // BUILD WHERE CLAUSE
    // ======================

    let where = "1=1";

    // State filter
    if (state) {
      where += ` AND STATE = '${state}'`;
    }

    // EF filter
    if (ef) {
      where += ` AND RATING = '${ef}'`;
    }

    // Date filter
    if (startDate && endDate) {

      const startMillis =
        new Date(startDate).getTime();

      const endMillis =
        new Date(endDate).getTime();

      where += `
        AND BEGIN_DATE >= DATE '${startDate}'
        AND BEGIN_DATE <= DATE '${endDate}'
      `;
    }

    // ======================
    // NOAA DAT URL
    // ======================

    const url =
      `https://services.dat.noaa.gov/arcgis/rest/services/nws_damageassessmenttoolkit/DamageViewer/FeatureServer/0/query?` +
      `where=${encodeURIComponent(where)}` +
      `&outFields=*` +
      `&f=geojson`;

    console.log(url);

    // ======================
    // FETCH DATA
    // ======================

    const response = await fetch(url);

    const data = await response.json();

    // ======================
    // REMOVE OLD LAYER
    // ======================

    if (tornadoLayer) {
      map.removeLayer(tornadoLayer);
    }

    // ======================
    // CREATE NEW LAYER
    // ======================

    tornadoLayer = L.geoJSON(data, {

      style: function(feature) {

        const rating =
          feature.properties.RATING;

        return {
          color: getEFColor(rating),
          weight: 3
        };
      },

      onEachFeature: function(feature, layer) {

        const props = feature.properties;

        // ======================
// CLICK EVENT
// ======================

layer.on("click", async () => {

  const panel =
    document.getElementById("detailsPanel");

  const content =
    document.getElementById("detailsContent");

  panel.classList.remove("hidden");
  
const photoHtml =
  await loadSurveyPhotos(
    props.OBJECTID
  );
  
content.innerHTML = `

  <div
    class="detail-header"
    style="
      background:${getEFColor(props.RATING)};
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
        ${props.BEGIN_DATE || 'N/A'}
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
});
      }

    }).addTo(map);

    // ======================
    // FIT MAP
    // ======================

    if (tornadoLayer.getBounds().isValid()) {
      map.fitBounds(tornadoLayer.getBounds());
    }

  } catch (error) {

    console.error(
      "Error loading NOAA DAT data:",
      error
    );
  }
}

// ======================
// BUTTON EVENT
// ======================

document
  .getElementById("applyFilters")
  .addEventListener(
    "click",
    loadTornadoData
  );

// ======================
// INITIAL LOAD
// ======================

loadTornadoData();
// ======================
// CLOSE PANEL
// ======================

document
  .getElementById("closePanel")
  .addEventListener("click", () => {

    document
      .getElementById("detailsPanel")
      .classList.add("hidden");

  });
