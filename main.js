// main.js




let allLayers = [];

let visibleLayers = [];

let selectedLayers = [];

let childrenDict = {};

let myColors = {};

let layerNum = 0;

let nameDict = {};

let customCommonNames = {}

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

let mapName = document.querySelector(".map-name");

let mapNameInput = document.querySelector(".map-name-input");

let saveButton = document.querySelector(".save-button");

let loadButton = document.querySelector(".load-button");


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
})

mapName.addEventListener('click', event => {
  setName();
})

mapNameInput.addEventListener('input', event => {
  mapName.innerHTML = mapNameInput.value;
})

mapNameInput.addEventListener("keypress", (event) => {
  console.log(event.keyCode)
  if (event.keyCode === 13) { // key code of the keybord key
    setName();
    console.log("Zzzzzzzzzzzzz")
    mapName.style.display = "block";
    mapNameInput.style.display = "none";
  }
});

mapNameInput.addEventListener("onfocusout", (event) => {
  setName();
  mapName.style.display = "block";
  mapNameInput.style.display = "none";
})

saveButton.addEventListener('click', event => {
  saveMap();
})

loadButton.addEventListener('click', event => {
  loadMap();
})



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
          getKey(res["name"]).then(key => {
            newLayer(key, res["name"], layerPanel);
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

function newLayer(key, name, parent) {
  if (!allLayers.includes(key)) {
    allLayers.push(key);
    visibleLayers.push(key);
    addLayer(key, name, parent, true);
  }
  else {
    nameDict[key].push(name)
  }
}

function addLayer(key, name, parent, visible) {

  nameDict[key] = [name];

  let col = newColor(allLayers.length);
  if (Object.keys(myColors).includes(key.toString())) {
    col = myColors[key];
  }
  else {
    myColors[key] = col;
  }

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

  let alphaPicker = document.createElement('input');
  newLayer.appendChild(alphaPicker);
  alphaPicker.classList.add('alpha-picker');
  alphaPicker.type = "range";


  let hexagon = document.createElement('span');
  newLayer.appendChild(hexagon);
  hexagon.classList.add('hexagon');
  hexagon.style.color = 'rgb(' + col[0] + ',' + col[1] + ',' + col[2] + ')';
  hexagon.innerHTML = "&#x2B22;";

  let colorPicker = document.createElement('input');
  hexagon.appendChild(colorPicker);
  colorPicker.classList.add('color-picker');

  colorPicker.value = rgbToHex(col[0], col[1], col[2]);
  colorPicker.type = "color";





  hexagon.addEventListener("click", (event) => {
    colorPicker.click();

  });


  colorPicker.addEventListener("input", (event) => {
    let col = hexToRgb(colorPicker.value);
    col.push(alphaPicker.value / 100 * 255);
    myColors[key] = col;
    hexagon.style.color = 'rgb(' + col[0] + ',' + col[1] + ',' + col[2] + ')';
    updateLayers();
    event.stopPropagation();
  });


  alphaPicker.addEventListener("input", (event) => {
    let col = hexToRgb(colorPicker.value);
    col.push(alphaPicker.value / 100 * 255);
    myColors[key] = col;
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

  let mainLayerTitleInput = document.createElement('input');
  layerTitle.appendChild(mainLayerTitleInput);
  mainLayerTitleInput.classList.add('layer-title-main-input');
  mainLayerTitleInput.innerHTML = name;

  let subLayerTitle = document.createElement('div');
  layerTitle.appendChild(subLayerTitle);
  subLayerTitle.classList.add('layer-title-sub');
  subLayerTitle.innerHTML = serchData[name]["commonName"];


  let subLayerTitleInput = document.createElement('input');
  layerTitle.appendChild(subLayerTitleInput);
  subLayerTitleInput.classList.add('layer-title-sub-input');

  if (Object.keys(customCommonNames).includes(key)) {
    subLayerTitleInput.innerHTML = customCommonNames[key];
  }
  else {
    subLayerTitleInput.innerHTML = serchData[name]["commonName"];
  }


  mainLayerTitle.addEventListener('click', event => {
    mainLayerTitle.style.display = "none";
    mainLayerTitleInput.style.display = "block";
    mainLayerTitleInput.value = mainLayerTitle.innerHTML;
    mainLayerTitleInput.focus();

  })

  subLayerTitle.addEventListener('click', event => {
    subLayerTitle.style.display = "none";
    subLayerTitleInput.style.display = "block";
    subLayerTitleInput.value = subLayerTitle.innerHTML;
    subLayerTitleInput.focus();

  })


  mainLayerTitleInput.addEventListener("blur", (event) => {
    console.log("out")
    mainLayerTitle.style.display = "block";
    mainLayerTitleInput.style.display = "none";
    mainLayerTitle.innerHTML = mainLayerTitleInput.value;
    nameDict[key] = [mainLayerTitleInput.value];
    serchData[nameDict[key]] = {
      "rank": serchData[name]["rank"],
      "commonName": serchData[name]["commonName"],
      "iNatID": serchData[name]["iNatID"]
    }
  })



  subLayerTitleInput.addEventListener("blur", (event) => {
    console.log("out2")
    subLayerTitle.style.display = "block";
    subLayerTitleInput.style.display = "none";
    subLayerTitle.innerHTML = subLayerTitleInput.value;
    customCommonNames[key] = subLayerTitleInput.value;
  })

  mainLayerTitleInput.addEventListener("keypress", (event) => {
    console.log(event.keyCode)
    if (event.keyCode === 13) { // key code of the keybord key
      mainLayerTitle.style.display = "block";
      mainLayerTitleInput.style.display = "none";
      mainLayerTitle.innerHTML = mainLayerTitleInput.value;
    }
  });

  subLayerTitleInput.addEventListener("keypress", (event) => {
    console.log(event.keyCode)
    if (event.keyCode === 13) { // key code of the keybord key
      subLayerTitle.style.display = "block";
      subLayerTitleInput.style.display = "none";
      subLayerTitle.innerHTML = subLayerTitleInput.value;
      customCommonNames[key] = subLayerTitleInput.value;
    }
  });


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
        getFillColor: myColors[key],
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
  for (const parent in Object.keys(childrenDict)) {
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


function updateLayerPanel() {
  allLayers.forEach((key, i) => {
    let parent = layerPanel;
    Object.keys(childrenDict).forEach(parent_key => {
      if (childrenDict[parent_key].includes(key)) {
        parent = parent_key
      }
    })
    let visible = false;
    if (visibleLayers.includes(key)) {
      visible = true;
    }
    addLayer(key, nameDict[key], parent);
    toggleLayer(key);
    toggleLayer(key);
  })
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
  for (const parent in Object.keys(childrenDict)) {
    if (childrenDict[Object.keys(childrenDict)[parent]].includes(key)) {
      childrenDict[Object.keys(childrenDict)[parent]].splice(childrenDict[Object.keys(childrenDict)[parent]].indexOf(key), 1);
    }
  }
  delete myColors[key]
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
        newLayer(layersToAdd[name][0], name, layersToAdd[name][1]);
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

function setName() {
  mapName.style.display = "none";
  mapNameInput.style.display = "block";
  mapNameInput.value = mapName.innerHTML;
  mapNameInput.focus();

}

function saveMap() {
  // Create the object (similar to a dict in Python)
  const myMap = {
    "allLayers": allLayers,
    "visibleLayers": visibleLayers,
    "childrenDict": childrenDict,
    "myColors": myColors,
    "layerNum": layerNum,
    "nameDict": nameDict,
    "customCommonNames": customCommonNames,
    "serchData": serchData
    
  };

  // Convert the object to a JSON string
  const jsonString = JSON.stringify(myMap, null, 2); // null and 2 are for pretty-printing

  // Create a Blob object representing the JSON data as a file
  const blob = new Blob([jsonString], { type: 'application/json' });

  // Create a URL for the Blob
  const url = URL.createObjectURL(blob);

  // Create an anchor element to download the file
  const a = document.createElement('a');
  a.href = url;
  a.download = mapName.innerHTML + '.json';  // Set the desired file name

  // Programmatically click the anchor element to trigger the download
  a.click();

  // Revoke the URL after the download
  URL.revokeObjectURL(url);
}

function loadMap() {

  const input = document.createElement('input');
  input.type = "file";
  input.accept = ".json"
  input.addEventListener('change', (event) => {
    // Get the selected file
    const file = event.target.files[0];
    mapName.innerHTML = file.name.split(".")[0];

    if (file.type === "application/json") {
      // Create a new FileReader to read the file
      const reader = new FileReader();
      // Define what happens when the file is read
      reader.onload = function (e) {
        try {
          // Parse the JSON content
          const jsonData = JSON.parse(e.target.result);

          allLayers = jsonData["allLayers"];
          visibleLayers = jsonData["visibleLayers"];
          childrenDict = jsonData["childrenDict"];
          myColors = jsonData["myColors"];
          layerNum = jsonData["layerNum"];
          nameDict = jsonData["nameDict"];
          customCommonNames = jsonData["customCommonNames"];
          serchData = jsonData["serchData"];
          

          updateLayerPanel();
          updateLayers();
          updateUI();
        }
        catch (err) {
          console.log(err)
        }

      };

      reader.readAsText(file);

    }


  })

  input.click();


}

// mobile

function switchView(view) {
  document.querySelector('#search-panel').style.display = "none";
  document.querySelector('#map').style.display = "none";
  document.querySelector('#layer-panel').style.display = "none";


  if (view != "map") {
    view += "-panel";
  }
  document.querySelector('#' + view).style.display = "block";

  if (view == "layer-panel") {
    document.querySelector("#middle").style.height = "85vh";
  }
  else {
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