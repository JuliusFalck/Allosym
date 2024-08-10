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
document.querySelector('.search-box').addEventListener('input', event => {
  search();
})

let result_list = document.querySelector('#result-list');

let layer_panel = document.querySelector('#layer-panel');


// Initialize Google Map
const map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 20, lng: 0},
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
    let response = await fetch("https://api.gbif.org/v1/species/suggest?status=ACCEPTED&nameType=SCIENTIFIC&q=" + search_box.value);
    const json = await response.json();

    clear_results()

    json.forEach((res, i) =>{

      let new_result_item = document.createElement('div');
      new_result_item.classList.add('result-item');

      result_list.appendChild(new_result_item);
      new_result_item.id = "result-" + i;

      



      let new_result_title = document.createElement('div');
      new_result_item.appendChild(new_result_title);
      new_result_title.classList.add('result-title');


      new_result_title.innerHTML = res["canonicalName"];;

      if (["GENUS", "SPECIES", "SUBSPECIES"].includes(res["rank"])){
        new_result_title.style.fontStyle = "italic"
      }


      let new_add_button = document.createElement('img');
      
      new_add_button.classList.add("add-button");
      
      new_result_item.appendChild(new_add_button);

      new_add_button.addEventListener('click', event => {
      const elements = Array.from(result_list.childNodes);
        elements.forEach(element =>{
          })
          new_species(res["canonicalName"])
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
  layerTitle.innerHTML = name;


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

  
  
  newLayer.addEventListener('click', event => {
  const elements = Array.from(layer_panel.childNodes);
  elements.forEach(element =>{
      element.classList.add("layer");
      element.classList.remove("layer-selected");
    })
    newLayer.classList.remove("layer");
    newLayer.classList.add("layer-selected");

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
    document.getElementById("layer-toggle-" + key).style.backgroundColor = 'black';

  }
  else{
    visibleLayers.push(key);
    document.getElementById("layer-toggle-" + key).style.backgroundColor = 'white';
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