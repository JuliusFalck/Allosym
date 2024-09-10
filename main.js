// main.js



let allLayers = [];

let visibleLayers = [];

let selectedLayers = [];

let childrenDict = {};

let myColors = [];

let layerNum = 0;

let nameDict = {};

let serchData = {};

const acceptedRanks = ["kingdom", "phylum", "class", "order", "family", "genus", "species", "subspecies"]

// Elements

let searchBox = document.querySelector('.search-box');

let resultList = document.querySelector('#result-list');

let layerPanel = document.querySelector('#layer-panel');

let explodeButton = document.querySelector('.explode-button');

let searchButton = document.querySelector('#search-button');

let mapButton = document.querySelector('#map-button');

let layerButton = document.querySelector('#layer-button');

let clearSearchButton = document.querySelector(".clear-search-button");

// Events

searchBox.addEventListener('input', event => {
  search();
})

explodeButton.addEventListener('click', event => {
  explode();
})

searchButton.addEventListener('click', event => {
  switchView("search");
  searchButton.style.borderBottom = "0.2vh solid white"; 
  mapButton.style.borderBottom = "0.2vh solid black";
  layerButton.style.borderBottom = "0.2vh solid black";
})

mapButton.addEventListener('click', event => {
  switchView("map");
  searchButton.style.borderBottom = "0.2vh solid black"; 
  mapButton.style.borderBottom = "0.2vh solid white";
  layerButton.style.borderBottom = "0.2vh solid black";

})

layerButton.addEventListener('click', event => {
  switchView("layer");
  searchButton.style.borderBottom = "0.2vh solid black"; 
  mapButton.style.borderBottom = "0.2vh solid black";
  layerButton.style.borderBottom = "0.2vh solid white";
  
})


clearSearchButton.addEventListener('click', event => {
  searchBox.value = "";
  searchBox.focus();
  search();
} )

// Initialize Google Map
const map = new google.maps.Map(document.getElementById('map'), {
  center: { lat: 20, lng: 20 },
  zoom: 3,
  mapTypeId: 'satellite',
  mapId: '4a1d5be91421f433',
  backgroundColor: "black",
  gestureHandling: "greedy"
});

// Initialize Deck.gl with Google Maps
let deckOverlay = new deck.GoogleMapsOverlay({
  layers: []
});

deckOverlay.setMap(map);


const MVTLayer = deck.MVTLayer;





async function search() {

  if (searchBox.value == "") {
    clear_results();
  }
  else {

    // search iNat for names
    let inat_response = await fetch("https://api.inaturalist.org/v1/taxa?q=" +
      searchBox.value +
      "&is_active=true&order=desc&order_by=observations_count");

    const inat_json = await inat_response.json();
    let results = inat_json["results"];

    clear_results();

    results.forEach((res, i) => {

      // filter accepted ranks
      if (acceptedRanks.includes(res["rank"])) {


        serchData[res["name"]] = {
          "rank": res["rank"],
          "commonName": res["preferred_common_name"],
          "iNatID": res["id"]
        }

        let new_result_item = document.createElement('div');
        new_result_item.classList.add('result-item');

        resultList.appendChild(new_result_item);
        new_result_item.id = "result-" + i;

        let new_titles = document.createElement('div');
        new_result_item.appendChild(new_titles);
        new_titles.classList.add('result-title');

        let new_result_title = document.createElement('div');
        new_titles.appendChild(new_result_title);
        new_result_title.classList.add('result-title');


        new_result_title.innerHTML = res["name"];

        let new_result_sub_title = document.createElement('div');
        new_titles.appendChild(new_result_sub_title);
        new_result_sub_title.classList.add('result-sub-title');

        new_result_sub_title.innerHTML = res["preferred_common_name"];

        if (["genus", "species", "subspecies"].includes(res["rank"])) {
          new_result_title.style.fontStyle = "italic";
        }


        let new_add_button = document.createElement('img');

        new_add_button.classList.add("add-button");

        new_result_item.appendChild(new_add_button);

        new_add_button.addEventListener('click', event => {
          const elements = Array.from(resultList.childNodes);
          elements.forEach(element => {
          })
          getKey(res["name"]).then(key => {
            addLayer(key, res["name"], layerPanel);
          }
          )

        })
      }
    })
  }
}


function clear_results() {
  resultList.innerHTML = "";
}


function addLayer(key, name, parent) {

  if (!allLayers.includes(key)) {
    nameDict[key] = [name];

    allLayers.push(key);
    visibleLayers.push(key);

    let col = newColor(allLayers.length);
    myColors.push(col);
    updateLayers();

    // add layer in list
    let newLayerContainer = document.createElement('div');
    parent.appendChild(newLayerContainer);
    newLayerContainer.classList.add('layer-container');
    if (parent == layerPanel) {
      newLayerContainer.style.marginLeft = "0";
    }

    let newLayer = document.createElement('div');
    newLayerContainer.appendChild(newLayer);
    newLayer.classList.add('layer');

    newLayer.id = "layer-" + key;

    newLayer.addEventListener("click", (event) => {
      selectLayer(key);
    });


    // Color Hexagon
    let colorPicker = document.createElement('input');
    newLayer.appendChild(colorPicker);
    colorPicker.classList.add('color-picker');

    colorPicker.value = rgbToHex(col[0], col[1], col[2]);
    colorPicker.type = "color";

    let hexagon = document.createElement('span');
    newLayer.appendChild(hexagon);
    hexagon.classList.add('hexagon');
    hexagon.style.color = 'rgb(' + col[0] + ',' + col[1] + ',' + col[2] + ')';
    hexagon.innerHTML = "&#x2B22;";

    colorPicker.addEventListener("input", (event) => {
      let col = hexToRgb(colorPicker.value);
      col.push(255 / 2);
      myColors[allLayers.indexOf(key)] = col;
      hexagon.style.color = 'rgb(' + col[0] + ',' + col[1] + ',' + col[2] + ')';
      updateLayers();
      event.stopPropagation();
    });

    // Layer Title
    let layerTitle = document.createElement('div');
    newLayer.appendChild(layerTitle);
    layerTitle.classList.add('layer-title');

    let mainLayerTitle = document.createElement('div');
    layerTitle.appendChild(mainLayerTitle);
    mainLayerTitle.classList.add('layer-title-main');
    mainLayerTitle.innerHTML = name;

    if (["genus", "species", "subspecies"].includes(serchData[name]["rank"])) {
      mainLayerTitle.style.fontStyle = "italic";
    }

    let subLayerTitle = document.createElement('div');
    layerTitle.appendChild(subLayerTitle);
    subLayerTitle.classList.add('layer-title-sub');
    subLayerTitle.innerHTML = serchData[name]["commonName"];

    // Toggle Layer
    let layerToggle = document.createElement('div');
    newLayer.appendChild(layerToggle);
    layerToggle.classList.add('layer-toggle');
    layerToggle.id = "layer-toggle-" + key;

    layerToggle.addEventListener('click', event => {
      toggleLayer(key);
      event.stopPropagation();
    })

    // Cross Mark
    let layerCross = document.createElement('img');
    newLayer.appendChild(layerCross);
    layerCross.classList.add('layer-cross');
    layerCross.src = "res/icon_X.svg";

    layerCross.addEventListener('click', event => {
      removeLayer(key);
      newLayer.parentElement.remove();
      updateLayers();
    })

    // child-count
    let childCount = document.createElement('div');
    newLayer.appendChild(childCount);
    childCount.classList.add('child-count');
    childCount.id = "child-count-" + key;

  }

  else {
    nameDict[key].push(name)
  }
}


async function getKey(name) {
  let response = await fetch("https://api.gbif.org/v1/species/match?strict=true&verbose=true&name=" + name);
  let res = await response.json();
  let key = 0;
  if (res["matchType"] != "EXACT") {
    res["alternatives"].some(r => {
      if (r["matchType"] == "EXACT") {
        if (Object.keys(r).includes("acceptedUsageKey")) {
          key = r["acceptedUsageKey"];
        }
        else {
          key = r["usageKey"];
        }
        return true;
      }
    });
  }
  if (key == 0) {
    if (Object.keys(res).includes("acceptedUsageKey")) {
      key = res["acceptedUsageKey"];
    }
    else {
      key = res["usageKey"];
    }
  }

  return key;

}

function toggleLayer(key) {
  if (visibleLayers.includes(key)) {
    visibleLayers.splice(visibleLayers.indexOf(key), 1);
    document.getElementById("layer-toggle-" + key).classList.add('layer-toggle-off');
    document.getElementById("layer-toggle-" + key).classList.remove('layer-toggle');

  }
  else {
    visibleLayers.push(key);
    document.getElementById("layer-toggle-" + key).classList.remove('layer-toggle-off');
    document.getElementById("layer-toggle-" + key).classList.add('layer-toggle');
  }

  updateLayers();
}


function updateLayers() {

  let layers = [];
  allLayers.forEach((key, i) => {
    if (visibleLayers.includes(key)) {
      const newLayer = new MVTLayer({
        id: 'mvt-layer' + key,
        data: 'https://api.gbif.org/v2/map/occurrence/density/{z}/{x}/{y}.mvt?srs=EPSG:3857&bin=hex&taxonKey=' + key, // Replace with your MVT source URL
        minZoom: 0,
        maxZoom: 23,
        getFillColor: myColors[i],
        getLineColor: [0, 0, 0, 0],
        lineWidthMinPixels: 1,
        pickable: true
      })
      layers.push(newLayer);
    }

  })

  deckOverlay.setProps({
    layers: layers
  });

  // update child count
  for (const parent in Object.keys(childrenDict)){
    document.getElementById("child-count-" + Object.keys(childrenDict)[parent]).innerHTML = childrenDict[Object.keys(childrenDict)[parent]].length;
  }

}


function updateUI() {

  let layerTools = document.getElementById("layer-tool-bar");

  if (selectedLayers.length != 0) {
    layerTools.style.display = "flex";
  }
  else {
    layerTools.style.display = "none";
  }

}

function selectLayer(key) {
  if (selectedLayers.includes(key)) {
    selectedLayers.splice(selectedLayers.indexOf(key), 1);
  }
  else {
    selectedLayers.push(key);
  }
  selectedLayers.forEach(key => {
    let cLayer = document.getElementById("layer-" + key);
    if (cLayer) {
      cLayer.classList.toggle("layer");
      cLayer.classList.toggle("layer-selected");
      cLayer.parentElement.classList.toggle("layer-container");
      cLayer.parentElement.classList.toggle("layer-container-selected");

    }
  })
  selectedLayers = [key];
  updateUI();

}

function removeLayer(key) {
  if (Object.keys(childrenDict).includes(key.toString())) {
    for (const childKey of childrenDict[key]) {
      removeLayer(childKey);

    }
  }

  // update children dict
  for (const parent in Object.keys(childrenDict)){
    if (childrenDict[Object.keys(childrenDict)[parent]].includes(key)){
      childrenDict[Object.keys(childrenDict)[parent]].splice(childrenDict[Object.keys(childrenDict)[parent]].indexOf(key), 1);
    }
  }

  myColors.splice(allLayers.indexOf(key), 1);
  allLayers.splice(allLayers.indexOf(key), 1);
  visibleLayers.splice(visibleLayers.indexOf(key), 1);
  selectedLayers.splice(selectedLayers.indexOf(key), 1);


}


async function explode() {
  selectedLayers.forEach(async (key) => {
    childrenDict[key] = [];

    // get parent taxa to merge

    await mergeSiblings(key);

    nameDict[key] = [...new Set(nameDict[key])];
    for (const name of nameDict[key]) {
      let layersToAdd = await getChildren(key, serchData[name]["iNatID"]);

      let sortedLayers = Object.keys(layersToAdd);
      sortedLayers.sort();
      sortedLayers.forEach(name => {
        addLayer(layersToAdd[name][0], name, layersToAdd[name][1]);
      })
    }
  })

}

async function getChildren(key, iNatID) {

  let layersToAdd = {};
  let inat_response = await fetch("https://api.inaturalist.org/v1/taxa?parent_id=" +
    + iNatID +
    "&order=desc&order_by=observations_count");

  const inat_json = await inat_response.json();
  for (let child of inat_json["results"]) {
    if (acceptedRanks.includes(child["rank"].toLowerCase())) {
      // update the inat version 
      child = await iNatSearch(child["name"]);
      // add inat data
      serchData[child["name"]] = { "rank": child["rank"], "commonName": child["preferred_common_name"], "iNatID": child["id"] };
      let parentLayer = document.getElementById("layer-" + key).parentElement;
      let childKey = await getKey(child["name"]);
      childrenDict[key].push(childKey);
      layersToAdd[child["name"]] = [childKey, parentLayer];
    }
    else {
      let newChildren = await getChildren(key, child["id"]);
      layersToAdd = Object.assign({}, layersToAdd, newChildren);
    }
  }

  return layersToAdd;

}

async function mergeSiblings(key) {
  let iNatID = serchData[nameDict[key][0]]["iNatID"];

  let inat_response = await fetch("https://api.inaturalist.org/v1/taxa?id=" +
    + iNatID +
    "&order=desc&order_by=observations_count");

  let inat_json = await inat_response.json();
  let ids = inat_json["results"][0]["ancestor_ids"];
  let parentID = ids[ids.length - 2];
  inat_response = await fetch("https://api.inaturalist.org/v1/taxa?parent_id=" +
    + parentID +
    "&order=desc&order_by=observations_count");

  inat_json = await inat_response.json();
  for (let child of inat_json["results"]) {
    serchData[child["name"]] = { "rank": child["rank"], "commonName": child["preferred_common_name"], "iNatID": child["id"] };
    let childKey = await getKey(child["name"]);
    if (allLayers.includes(childKey)) {
      nameDict[childKey].push(child["name"]);
    }
  }




}

async function iNatSearch(name) {
  // search iNat for names
  let inat_response = await fetch("https://api.inaturalist.org/v1/taxa?q=" +
    name +
    "&is_active=true&order=desc&order_by=observations_count");

  const inat_json = await inat_response.json();
  let results = inat_json["results"];

  let result = "";
  results.some((res) => {
    if (res["name"] == name) {
      result = res;
      return true;
    }

  })
  return result;
}



// mobile

function switchView(view){
  document.querySelector('#search-panel').style.display = "none";
  document.querySelector('#map').style.display = "none";
  document.querySelector('#layer-panel').style.display = "none";


  if (view != "map"){
    view += "-panel";
  }
  document.querySelector('#' + view).style.display = "block";

  if (view == "layer-panel"){
    document.querySelector("#middle").style.height = "85vh";
  }
  else{
    document.querySelector("#middle").style.height = "90vh";
  }

}

// color algorithems

function newColor(n) {
  let new_col = hslToRgb(colors[n], 1, 0.5)
  new_col.push(255 / 2)
  return new_col
}

function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function hexToRgb(hex, result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)) {
  return result ? result.map(i => parseInt(i, 16)).slice(1) : null
}


function hslToRgb(h, s, l) {
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hueToRgb(p, q, h + 1 / 3);
    g = hueToRgb(p, q, h);
    b = hueToRgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function hueToRgb(p, q, t) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}