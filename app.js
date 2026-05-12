// ======================
// LOADING
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
// MAP
// ======================

const map =
  L.map("map", {
    zoomControl: true
  }).setView(
    [39.5, -98.35],
    4
  );

// ======================
// BASEMAP
// ======================

L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
  {
    attribution:
      "Tiles © Esri"
  }
).addTo(map);

// ======================
// GLOBAL LAYERS
// ======================

let tornadoLayer;
let damagePointLayer;
let polygonLayer;

// ======================
// STATES
// ======================

const states = [

  "AL","AK","AZ","AR","CA","CO","CT","DE",
  "FL","GA","HI","ID","IL","IN","IA","KS",
  "KY","LA","ME","MD","MA","MI","MN","MS",
  "MO","MT","NE","NV","NH","NJ","NM","NY",
  "NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV",
  "WI","WY"

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

  option.textContent =
    state;

  stateSelect.appendChild(
    option
  );

});

// ======================
// DAT COLORS
// ======================

function getEFColor(rating) {

  switch (rating) {

    case "EF0":
      return "#00d5ff";

    case "EF1":
      return "#37ff00";

    case "EF2":
      return "#fff000";

    case "EF3":
      return "#ff9900";

    case "EF4":
      return "#ff0000";

    case "EF5":
      return "#b000b0";

    case "EFU":
      return "#9e9e9e";

    default:
      return "#9e9e9e";

  }

}

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

  const order = [
    "EFU",
    "EF0",
    "EF1",
    "EF2",
    "EF3",
    "EF4",
    "EF5"
  ];

  let strongest = "N/A";

  order.forEach(rating => {

    if (
      ratings.includes(rating)
    ) {

      strongest = rating;

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
// TORNADO DETAILS
// ======================

function showTornadoDetails(
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

    <table class="dat-table">

      <tr>
        <td>event_id</td>
        <td>${props.EVENT_ID || "N/A"}</td>
      </tr>

      <tr>
        <td>rating</td>
        <td>${props.RATING || "EFU"}</td>
      </tr>

      <tr>
        <td>state</td>
        <td>${props.STATE || "N/A"}</td>
      </tr>

      <tr>
        <td>county</td>
        <td>${props.COUNTY || "N/A"}</td>
      </tr>

      <tr>
        <td>wfo</td>
        <td>${props.WFO || "N/A"}</td>
      </tr>

      <tr>
        <td>injuries</td>
        <td>${props.INJURIES || 0}</td>
      </tr>

      <tr>
        <td>fatalities</td>
        <td>${props.FATALITIES || 0}</td>
      </tr>

      <tr>
        <td>path_length</td>
        <td>${props.PATH_LENGTH || "N/A"}</td>
      </tr>

      <tr>
        <td>path_width</td>
        <td>${props.PATH_WIDTH || "N/A"}</td>
      </tr>

      <tr>
        <td>max_wind</td>
        <td>${props.MAX_WIND || "N/A"}</td>
      </tr>

      <tr>
        <td>begin_date</td>
        <td>${formatDate(props.BEGIN_DATE)}</td>
      </tr>

      <tr>
        <td>end_date</td>
        <td>${formatDate(props.END_DATE)}</td>
      </tr>

      <tr>
        <td>comments</td>
        <td>${props.COMMENTS || "None"}</td>
      </tr>

    </table>

  `;

}

// ======================
// DAMAGE POINT DETAILS
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

    <table class="dat-table">

      <tr>
        <td>damage_indicator</td>
        <td>${props.DI || "N/A"}</td>
      </tr>

      <tr>
        <td>dod</td>
        <td>${props.DOD || "N/A"}</td>
      </tr>

      <tr>
        <td>rating</td>
        <td>${props.RATING || "EFU"}</td>
      </tr>

      <tr>
        <td>estimated_wind</td>
        <td>${props.ESTIMATED_WIND || "N/A"}</td>
      </tr>

      <tr>
        <td>wfo</td>
        <td>${props.WFO || "N/A"}</td>
      </tr>

      <tr>
        <td>comments</td>
        <td>${props.COMMENTS || "None"}</td>
      </tr>

    </table>

  `;

}

// ======================
// LOAD TORNADO DATA
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

    let where = "1=1";

    if (state) {

      where += `
        AND STATE='${state}'
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

          opacity: 1

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
              () => {

                showTornadoDetails(
                  feature.properties
                );

              }
            );

          }

      }).addTo(map);

    updateStats(
      data.features
    );

  } catch (error) {

    console.error(error);

  }

  hideLoading();

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
          (feature, latlng) => {

            const color =
              getEFColor(
                feature.properties.RATING
              );

            return L.marker(
              latlng,
              {
                icon: L.divIcon({

                  className:
                    "damage-point-icon",

                  html: `
                    <div
                      style="
                        width: 0;
                        height: 0;

                        border-left: 7px solid transparent;
                        border-right: 7px solid transparent;
                        border-top: 14px solid ${color};

                        filter:
                          drop-shadow(0 0 1px #000);
                      "
                    ></div>
                  `,

                  iconSize: [14, 14],

                  iconAnchor: [7, 7]

                })
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

  } catch (error) {

    console.error(error);

  }

}

// ======================
// LOAD POLYGONS
// ======================

async function loadDamagePolygons() {

  try {

    const url =
      `https://services.dat.noaa.gov/arcgis/rest/services/nws_damageassessmenttoolkit/DamageViewer/FeatureServer/2/query?where=1%3D1&outFields=*&f=geojson`;

    const response =
      await fetch(url);

    const data =
      await response.json();

    if (polygonLayer) {

      map.removeLayer(
        polygonLayer
      );

    }

    polygonLayer =
      L.geoJSON(data, {

        style: feature => ({

          color:
            getEFColor(
              feature.properties.RATING
            ),

          fillColor:
            getEFColor(
              feature.properties.RATING
            ),

          weight: 2,

          opacity: 1,

          fillOpacity: 0.25

        }),

        onEachFeature:
          (feature, layer) => {

            layer.on(
              "mouseover",
              () => {

                layer.setStyle({
                  weight: 4,
                  fillOpacity: 0.45
                });

              }
            );

            layer.on(
              "mouseout",
              () => {

                layer.setStyle({
                  weight: 2,
                  fillOpacity: 0.25
                });

              }
            );

            layer.on(
              "click",
              () => {

                showTornadoDetails(
                  feature.properties
                );

              }
            );

          }

      }).addTo(map);

  } catch (error) {

    console.error(error);

  }

}

// ======================
// APPLY FILTERS
// ======================

document
  .getElementById(
    "applyFilters"
  )
  .addEventListener(
    "click",
    () => {

      loadTornadoData();

    }
  );

// ======================
// RESET FILTERS
// ======================

document
  .getElementById(
    "resetFilters"
  )
  .addEventListener(
    "click",
    () => {

      document
        .getElementById(
          "startDate"
        )
        .value = "";

      document
        .getElementById(
          "endDate"
        )
        .value = "";

      document
        .getElementById(
          "stateFilter"
        )
        .value = "";

      loadTornadoData();

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
// LAYER TOGGLES
// ======================

document
  .getElementById(
    "toggleTracks"
  )
  .addEventListener(
    "change",
    e => {

      if (e.target.checked) {

        map.addLayer(
          tornadoLayer
        );

      } else {

        map.removeLayer(
          tornadoLayer
        );

      }

    }
  );

document
  .getElementById(
    "togglePoints"
  )
  .addEventListener(
    "change",
    e => {

      if (e.target.checked) {

        map.addLayer(
          damagePointLayer
        );

      } else {

        map.removeLayer(
          damagePointLayer
        );

      }

    }
  );

document
  .getElementById(
    "togglePolygons"
  )
  .addEventListener(
    "change",
    e => {

      if (e.target.checked) {

        map.addLayer(
          polygonLayer
        );

      } else {

        map.removeLayer(
          polygonLayer
        );

      }

    }
  );

// ======================
// MAP MOVE RELOAD
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

loadDamagePolygons();
