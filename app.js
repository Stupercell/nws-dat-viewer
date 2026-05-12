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

const map =
  L.map("map").setView(
    [39.5, -98.35],
    4
  );

L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
  {
    attribution:
      "Tiles © Esri"
  }
).addTo(map);

let tornadoLayer;
let damagePointLayer;
let polygonLayer;

const states = [
  "AL","AK","AZ","AR","CA","CO","CT","DE",
  "FL","GA","HI","ID","IL","IN","IA","KS",
  "KY","LA","ME","MD","MA","MI","MN","MS",
  "MO","MT","NE","NV","NH","NJ","NM","NY",
  "NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV",
  "WI","WY"
];

states.forEach(state => {

  const option =
    document.createElement(
      "option"
    );

  option.value = state;

  option.textContent =
    state;

  document
    .getElementById(
      "stateFilter"
    )
    .appendChild(option);

});

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

    default:
      return "#9e9e9e";

  }

}

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

  order.forEach(r => {

    if (
      ratings.includes(r)
    ) {

      strongest = r;

    }

  });

  document
    .getElementById(
      "statStrongest"
    )
    .textContent =
      strongest;

  const statesVisible =
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
      statesVisible.size;

}

function openDetails(props) {

  document
    .getElementById(
      "detailsPanel"
    )
    .classList.remove(
      "hidden"
    );

  document
    .getElementById(
      "detailsContent"
    )
    .innerHTML = `

      <table class="datTable">

        ${Object.entries(props)
          .map(
            ([key, value]) => `
              <tr>
                <td>${key}</td>
                <td>${value ?? "N/A"}</td>
              </tr>
            `
          )
          .join("")}

      </table>

    `;

}

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
              "click",
              () => {

                openDetails(
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

async function loadDamagePoints() {

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
                  "damagePoint",

                html: `
                  <div
                    style="
                      width:0;
                      height:0;

                      border-left:6px solid transparent;
                      border-right:6px solid transparent;
                      border-top:12px solid ${color};

                      transform:rotate(180deg);
                    "
                  ></div>
                `,

                iconSize: [12, 12],
                iconAnchor: [6, 6]

              })
            }
          );

        },

      onEachFeature:
        (feature, layer) => {

          layer.on(
            "click",
            () => {

              openDetails(
                feature.properties
              );

            }
          );

        }

    }).addTo(map);

}

async function loadDamagePolygons() {

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

        weight: 1,

        opacity: 1,

        fillOpacity: 0.08

      })

    }).addTo(map);

}

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

loadTornadoData();

loadDamagePoints();

loadDamagePolygons();
