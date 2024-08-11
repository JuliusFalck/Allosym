// main.js


let allLayers = [];

let visibleLayers = [];



let layerColors = [[255, 0, 0, 255/2],
                    [0, 255, 0, 255/2],
                    [0, 0, 255, 255/2],
                    [255, 255, 0, 255/2],
                    [0, 255, 255, 255/2],
                    [255, 0, 255, 255/2],
                    [150, 255, 100, 255/2],
                    [100, 150, 255, 255/2],
                    [255, 100, 150, 255/2]];


let layerNum = 0;

let serchData = {}

document.querySelector('.search-box').addEventListener('input', event => {
  search();
})

let result_list = document.querySelector('#result-list');

let layer_panel = document.querySelector('#layer-panel');


// Initialize Google Map
const map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 20, lng: 20},
    zoom: 3,
    mapTypeId: 'satellite',
    mapId: '4a1d5be91421f433',
    backgroundColor: "black"
  });
  
  // Initialize Deck.gl with Google Maps
  let deckOverlay = new deck.GoogleMapsOverlay({
    layers: []
  });
  
  deckOverlay.setMap(map);
  

  const MVTLayer = deck.MVTLayer;





async function search(){
    let search_box = document.querySelector('.search-box');
    if (search_box.value == ""){
      clear_results();
    }
    else{

    // search iNat for names
    let inat_response = await fetch("https://api.inaturalist.org/v1/taxa?q=" +
       search_box.value +
        "&is_active=true&order=desc&order_by=observations_count");

    const inat_json = await inat_response.json();
    let results = inat_json["results"];

    clear_results();
    
    results.forEach((res, i) =>{

      serchData[res["name"]] = {"rank": res["rank"], "commonName": res["preferred_common_name"]}
      let new_result_item = document.createElement('div');
      new_result_item.classList.add('result-item');

      result_list.appendChild(new_result_item);
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

      if (["genus", "species", "subspecies"].includes(res["rank"])){
        new_result_title.style.fontStyle = "italic";
      }


      let new_add_button = document.createElement('img');
      
      new_add_button.classList.add("add-button");
      
      new_result_item.appendChild(new_add_button);

      new_add_button.addEventListener('click', event => {
      const elements = Array.from(result_list.childNodes);
        elements.forEach(element =>{
          })
          new_species(res["name"]);
      })

    } )
      
    }
  }

function clear_results(){
  result_list.innerHTML = "";
}


function new_species(name){


  get_key(name).then(key => {
    allLayers.push(key);
    visibleLayers.push(key);
    updateLayers();
  
  
  // add layer in list
  let newLayer = document.createElement('div');
  layer_panel.appendChild(newLayer);
  newLayer.classList.add('layer');
  
  newLayer.id = "layer-" + key;

  // Color Hexagon
  let colorPicker = document.createElement('input'); 
  newLayer.appendChild(colorPicker);
  colorPicker.classList.add('color-picker');
  let col = layerColors[allLayers.length-1];
  colorPicker.value = rgbToHex(col[0], col[1], col[2]);
  colorPicker.type = "color";

  let hexagon = document.createElement('span'); 
  newLayer.appendChild(hexagon);
  hexagon.classList.add('hexagon');
  hexagon.style.color = 'rgb(' + col[0] +','+ col[1] +','+ col[2] + ')';
  hexagon.innerHTML = "&#x2B22;";

  colorPicker.addEventListener("input",(event)=>{
    let col = hexToRgb(colorPicker.value);
    col.push(255/2);
    layerColors[allLayers.indexOf(key)] = col;
    hexagon.style.color = 'rgb(' + col[0] +','+ col[1] +','+ col[2] + ')';
    updateLayers();
 });





  // Layer Title
  let layerTitle = document.createElement('div');
  newLayer.appendChild(layerTitle);
  layerTitle.classList.add('layer-title');

  let mainLayerTitle = document.createElement('div');
  layerTitle.appendChild(mainLayerTitle);
  mainLayerTitle.classList.add('layer-title-main');
  mainLayerTitle.innerHTML = name;

  if (["genus", "species", "subspecies"].includes(serchData[name]["rank"])){
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
  })

  // Cross Mark
  let layerCross = document.createElement('img');
  newLayer.appendChild(layerCross);
  layerCross.classList.add('layer-cross');
  layerCross.src = "res/icon_X.svg";

  layerCross.addEventListener('click', event => {
    remove_layer(key);
    newLayer.remove();
  })

  

  });
}




async function get_key(name){
  let response = await fetch("https://api.gbif.org/v1/species/match?name=" + name);
  const json = await response.json();
  return json["usageKey"]
}

function toggleLayer(key){
  if (visibleLayers.includes(key)){
    visibleLayers.splice(visibleLayers.indexOf(key), 1); 
    document.getElementById("layer-toggle-" + key).classList.add('layer-toggle-off');
    document.getElementById("layer-toggle-" + key).classList.remove('layer-toggle');

  }
  else{
    visibleLayers.push(key);
    document.getElementById("layer-toggle-" + key).classList.remove('layer-toggle-off');
    document.getElementById("layer-toggle-" + key).classList.add('layer-toggle');
  }
  
  updateLayers()
}


function updateLayers(){


  let layers = [];

  allLayers.forEach((key, i) =>{
    if (visibleLayers.includes(key)){
      const newLayer = new MVTLayer({
        id: 'mvt-layer' + key,
        data: 'https://api.gbif.org/v2/map/occurrence/density/{z}/{x}/{y}.mvt?srs=EPSG:3857&bin=hex&taxonKey=' + key, // Replace with your MVT source URL
        minZoom: 0,
        maxZoom: 23,
        getFillColor: layerColors[i],
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
}




function remove_layer(key){
  layerColors.splice(allLayers.indexOf(key), 1);
  allLayers.splice(allLayers.indexOf(key), 1);
  visibleLayers.splice(visibleLayers.indexOf(key), 1);
  

  updateLayers();
}



function new_color(){
  let new_col = [0, 0, 0, 255/2];
  new_col[layer_count%3] = 255;
  return new_col
}

// Function to change layer color dynamically
function changeLayerColor(index, newColor) {
  layer_colors[index] = newColor;
  updateLayer();
}



function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function hexToRgb(hex, result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)) {
  return result ? result.map(i => parseInt(i, 16)).slice(1) : null
}