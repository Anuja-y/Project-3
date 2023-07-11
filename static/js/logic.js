// Base url for the data
let url = "/api/covid";

// Set default selected option
let selectedOption = "Cases";

// Declare variables in the global scope
let covid_data;
let myMap;
let markersLayer;
let data;

// Function to determine marker size
function markerSize(value, selectedOption) {
  if (selectedOption === "Cases") {
    return value / 2000000;
  } else if (selectedOption === "Deaths") {
    return value / 30000;
  }
  return 0; // Default size if option is neither "Cases" nor "Deaths"
}

// Function to determine marker colour
function selectColour(value, selectedOption) {
  if (selectedOption === "Cases") {
    if (value <= 100000) return "#00FFEA";
    else if (value <= 300000) return "#00C8FF";
    else if (value <= 500000) return "#0066FF";
    else if (value <= 700000) return "#000DFF";
    else if (value <= 900000) return "#2F255E";
    else return "#1A162B";
  } else if (selectedOption === "Deaths") {
    if (value <= 100000) return "#4CAF50";
    else if (value <= 300000) return "#D4E157";
    else if (value <= 500000) return "#FFF176";
    else if (value <= 700000) return "#FFCC80";
    else if (value <= 900000) return "#EF6C00";
    else return "#B71C1C";
  }
}

// Function to create features (markers)
function createFeatures(geoData) {
  function onEachFeature(feature, layer) {
    let cumulativeCasesPopup = feature.properties.New_cases.toLocaleString();
    let cumulativeDeathsPopup = feature.properties.New_deaths.toLocaleString();
    layer.bindPopup(`<h3>Country: ${feature.properties.Country}</h3><hr><p>Cumulative Cases: ${cumulativeCasesPopup}</p><hr><p>Cumulative Deaths: ${cumulativeDeathsPopup}</p>`);
  }

  covid_data = L.geoJSON(geoData, {
    onEachFeature: onEachFeature,
    // Features
    pointToLayer: function(feature, coordinate) {
      let value;
      if (selectedOption === "Cases") {
        value = feature.properties.New_cases;
      } else if (selectedOption === "Deaths") {
        value = feature.properties.New_deaths;
      }

      let markers = {
        radius: markerSize(value, selectedOption),
        fillColor: selectColour(value, selectedOption),
        fillOpacity: 0.7,
        color: selectColour(value, selectedOption),
        weight: 5,
      };
      return L.circleMarker(coordinate, markers);
    }
  });

  createMap();
}

// Function to create map
function createMap() {
  // Create the base layers.
  let street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  });

  let topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
  });

  // Create a baseMaps object.
  let baseMaps = {
    "Street Map": street,
    "Topographic Map": topo
  };

  // Create an overlay object to hold our overlay.
  let overlayMaps = {
    "Covid": covid_data
  };

  // Create our map, giving it the streetmap and covid_data layers to display on load.
  myMap = L.map("map", {
    center: [40.00, 10.00],
    zoom: 2,
    layers: [street, covid_data]
  });

  // Create a layer control.
  // Pass it our baseMaps and overlayMaps.
  // Add the layer control to the map.
  L.control.layers(baseMaps, overlayMaps, {
    collapsed: false
  }).addTo(myMap);

  // Create legend for map
  let legend = L.control({position: "bottomright"});
  legend.onAdd = function () {
    let div = L.DomUtil.create("div", "info legend");
    let cumulative_values = [0, 100000, 300000, 500000, 700000, 900000];

    // loop through density intervals
    for (let i = 0; i < cumulative_values.length; i++) {
      div.innerHTML +=
        '<i style="background:' + selectColour(cumulative_values[i] + 1, selectedOption) + '"></i> ' +
        cumulative_values[i] + (cumulative_values[i + 1] ? '&ndash;' + cumulative_values[i + 1] + '<br>' : '+');
    }
    return div;
  };
  legend.addTo(myMap);

  // Call the updateMarkers function initially to update the markers and legends
  updateMarkers();
}

// Function to update markers and legends
function updateMarkers() {
  // Update the legend
  let legend = document.getElementsByClassName('info legend')[0];
  let cumulative_values = [0, 100000, 300000, 500000, 700000, 900000];
  let legendContent = "";

  for (let i = 0; i < cumulative_values.length; i++) {
    legendContent +=
      '<i style="background:' + selectColour(cumulative_values[i] + 1, selectedOption) + '"></i> ' +
      cumulative_values[i] + (cumulative_values[i + 1] ? '&ndash;' + cumulative_values[i + 1] + '<br>' : '+');
  }

  legend.innerHTML = legendContent;

  // Update the markers
  covid_data.eachLayer(function(layer) {
    let value;
    if (selectedOption === "Cases") {
      value = layer.feature.properties.New_cases;
    } else if (selectedOption === "Deaths") {
      value = layer.feature.properties.New_deaths;
    }

    if (value) {
      let size = markerSize(value, selectedOption);
      let color = selectColour(value, selectedOption);

      layer.setRadius(size);
      layer.setStyle({
        fillColor: color,
        color: color,
        weight: 5,
      });
    }
  });
}

// Function to change the option
function optionChanged(selectedValue) {
  // Update the selected option if it has changed
  if (selectedOption !== selectedValue) {
    selectedOption = selectedValue;
    console.log("Selected Option in optionChanged:", selectedOption);
    updateMarkers();
    createBarGraph(data.features, selectedOption);
  }
}

// Retrieve data using d3 and call createFeatures
d3.json(url).then(function(retrievedData) {
  data = retrievedData; // Assign the retrieved data to the global variable
  createFeatures(data.features);
  console.log(data);
  createBarGraph(data.features, selectedOption); // Call createBarGraph here
});

// Function to create the bar graph
function createBarGraph(geoData, selectedOption) {
  let value;
  if (selectedOption === "Cases") {
    value = "New_cases";
  } else if (selectedOption === "Deaths") {
    value = "New_deaths";
  }
  // Extract the required data for the chart
  let chartData = geoData.map(feature => {
    return {
      country: feature.properties.Country,
      value: feature.properties[value]
    };
  });

  // Sort the data based on the selected option
  chartData.sort((a, b) => b.value - a.value);

  // Select the top 10 countries
  let top10Countries = chartData.slice(0, 10);

  // Create the trace for the bar graph
  let trace = {
    x: top10Countries.map(data => data.country),
    y: top10Countries.map(data => data.value),
    type: "bar"
  };

  // Create the layout for the bar graph
  let layout = {
    title: `Top 10 Countries with ${selectedOption}`,
    xaxis: {
      title: "Country"
    },
    yaxis: {
      title: selectedOption
    }
  };

  // Update the bar graph using Plotly
  Plotly.react("chart-container", [trace], layout);
}
