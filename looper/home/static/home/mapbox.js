import { RandomLoop } from "./random_loop.js";
import { RandomRoute } from "./random_route.js";
import { CustomRoute} from "./custom_route.js";

mapboxgl.accessToken = 'pk.eyJ1IjoiZGF2ZWppbnlvdW5nIiwiYSI6ImNscm84czI4ajA3ZHYya2w5c29wZmhwdWsifQ.4EwYfetiww7nb40hQV_RNQ';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [-123.12, 49.28],
    zoom: 10,
    projection: 'mercator'
});

let routeType;

const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

// Script for selecting the type of route you want to create
document.getElementById('randLoopButton').addEventListener('click', function() {
    if(!(routeType instanceof RandomLoop)){
        clearForm();
        routeType = new RandomLoop();
        showForm(routeType.form);
    }
});
document.getElementById('randRouteButton').addEventListener('click', function() {
    if(!(routeType instanceof RandomRoute)){
        clearForm();
        routeType = new RandomRoute();
        showForm(routeType.form);
    }
});
document.getElementById('customRouteButton').addEventListener('click', function() {
    if(!(routeType instanceof CustomRoute)){
        clearForm();
        routeType = new CustomRoute();
        showForm(routeType.form);
    }
});

document.getElementById('streetView').addEventListener('click', function() {
    if(map.getStyle().name != 'Mapbox Streets'){
        map.setStyle('mapbox://styles/mapbox/streets-v12');
    }
});

document.getElementById('satelliteView').addEventListener('click', function() {
    if(map.getStyle() != 'Mapbox Satellite Streets'){
        map.setStyle('mapbox://styles/mapbox/satellite-streets-v12');
    }
});


function showForm(selectedForm) {
    // Hide all forms
    const allForms = document.querySelectorAll('form');
    allForms.forEach(form => form.classList.add('d-none'));

    // Show the selected form
    if(selectedForm){
        selectedForm.classList.remove('d-none');
    }
    document.querySelectorAll(".universalFormItems").forEach(form => {
        form.classList.remove('d-none');
    });
    routeType.createInitialGeocoders(); 
    initializeGeocoders(routeType.allGeocoders);
}

// Script for finding current location
const geolocateControl = new mapboxgl.GeolocateControl({
    positionOptions: {
        enableHighAccuracy: true
    },
    showUserHeading: true,
    showUserLocation: false, // Hide user location marker
    showAccuracyCircle: false // Hide accuracy circle
});
map.addControl(geolocateControl);

let curLocationButtons = document.querySelectorAll('.cur-location-btn');
curLocationButtons.forEach(button => {
    button.addEventListener('click', function(event){
        geolocateControl.trigger();
    });
});

// Script for finding current location
geolocateControl.on('geolocate', (event) => {
    const coordinates = [event.coords.longitude, event.coords.latitude];
    if (routeType){
        setMarker(coordinates);
    }
})

map.on('style.load', () => {
    map.addSource('mapbox-dem', {
        'type': 'raster-dem',
        'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
        'tileSize': 512,
        'maxzoom': 14
    });
    // add the DEM source as a terrain layer with exaggerated height
    map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
});

// Script for location of clicked area on map
map.on('click', (event) => {
    const coordinates = [event.lngLat.lng, event.lngLat.lat];
    if (routeType && !routeType.isGenerated){
        setMarker(coordinates);
    }
});

function setMarker(coordinates, marker) {
    getPlaceName(coordinates)
        .then(placeName => {
            if(marker == null){
                routeType.setMarkerWithCorrectType(coordinates, placeName);
            }
            else {
                routeType.updateLocationForm(marker, placeName);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}


document.body.addEventListener('click', function(event) {
    if (routeType && (event.target.classList.contains('popupButton'))){
        routeType.saveMarker(event.target.classList);
    }
});


document.getElementById('generateRoute').addEventListener('click', function(event) {
    calculateOptimizedRoute();
});

// fix when on geocoder and press enter for suggested values
document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        calculateOptimizedRoute();
    }
});

let myLineChart = new Chart(document.getElementById('chart-canvas'), {
    type: 'line',
    data: {
        labels: [],
        datasets: []
    },
    options: {
        plugins: {
            legend: {
                display: false
            },
            title: {
                display: true,
                align: 'start',
                text: 'Elevation (m)'
            }
        },
        maintainAspectRatio: false,
        responsive: true,
        scales: {
            x: {
                grid: {
                    display: false
                }
            },
            y: {
                min: 0,
                grid: {
                    display: false
                }
            }
        },
        elements: {
            point: {
                radius: 0
            }
        },
        layout: {
            padding: {
                top: 6,
                right: 20,
                bottom: -10,
                left: 20
            }
        }
    }
});

function updateElevationProfile(lineData) {
    const chunks = turf.lineChunk(lineData, 0.01).features;
    const elevations = [
        ...chunks.map((feature) => {
            return map.queryTerrainElevation(
                feature.geometry.coordinates[0]
            );
        }),
        map.queryTerrainElevation(
            chunks[chunks.length - 1].geometry.coordinates[1]
        )
    ];
    let elevationGain = 0;
    let index = 0;
    let currentElevation = elevations[0];
    while (index < elevations.length) {
        if (currentElevation < elevations[index]) {
            elevationGain += elevations[index] - currentElevation;
        }
        currentElevation = elevations[index];
        index += 10; // sampling every 10 meters
    }

    myLineChart.data.labels = elevations.map(() => '');
    myLineChart.data.datasets[0] = {
        data: elevations,
        fill: false,
        tension: 1
    };
    myLineChart.update();
    return elevationGain;
}

// walkway bias is slowing the generation - may want to obsolete this parameter
async function calculateOptimizedRoute(generateButtonClicked=true) {
    if(generateButtonClicked){
        if(!routeType.validateFormSubmission()){
            endLoadingAnimation();
            return;
        }
    }
    startLoadingAnimation();
    let exerciseType = document.getElementById('runCheck').checked ? 'walking' : 'cycling';
    let walkwayBias = document.getElementById('runCheck').checked ? 'walkway_bias=0.35' : '';
    const waypointCoords = getWaypointCoordinates(generateButtonClicked);
    const queryURL = `https://api.mapbox.com/directions/v5/mapbox/${exerciseType}/${waypointCoords}?&alternatives=true&annotations=distance&continue_straight=false&${walkwayBias}&geometries=geojson&overview=full&steps=true&access_token=${mapboxgl.accessToken}`;

    const controller = new AbortController();
    const signal = controller.signal;

    try {
        const response = await fetch(queryURL, { signal });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        removeExistingRouteLayer();
        const routes = data.routes;
        const allCoordinates = routes.reduce((acc, route) => {
            return acc.concat(route.geometry.coordinates);
        }, []);

        const route = data.routes[0];
        const routeCoordinates = route.geometry.coordinates;

        if(routeType instanceof RandomLoop && generateButtonClicked){
            let distanceMargin = routeType.getDistanceMargin();
            if(route.distance <  distanceMargin['min'] || route.distance > distanceMargin['max']) {
                controller.abort();
                calculateOptimizedRoute();
                return;
            }
            addMarkersToMap();
        }
        enableDraggableMarkers();

        if(generateButtonClicked){
            const bounds = allCoordinates.reduce((bounds, coord) => {
                return bounds.extend(coord);
            }, new mapboxgl.LngLatBounds(allCoordinates[0], allCoordinates[0]));
            map.fitBounds(bounds, {
                padding: 40,
                linear: true
            });
        }

        let lineData = {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'LineString',
                coordinates: routeCoordinates
            }
        };

        map.addSource('route', { 
            type: 'geojson', 
            data: lineData
        });
        map.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': '#174ba6',
                'line-width': 6.5
            }
        });
        map.addLayer({  
            id: 'arrows',  
            type: 'symbol',  
            source: 'route',  
            layout: {  
                'symbol-placement': 'line',  
                'text-field': '▶',  
                'text-size': ['interpolate', ['linear'], ['zoom'], 12, 24, 22, 40],  
                'symbol-spacing': ['interpolate', ['linear'], ['zoom'], 12, 65, 22, 200],  
                'text-keep-upright': false  
            },  
            paint: {  
                'text-color': '#3887be',  
                'text-halo-color': 'hsl(55, 11%, 96%)',  
                'text-halo-width': 3  
            }  
            },  
            'waterway-label'  
        );
        let elevationGain = updateElevationProfile(lineData);
        routeDetails(route, elevationGain);
        routeType.isGenerated = true;
        endLoadingAnimation();
    } catch (error) {
        endLoadingAnimation();
        if (error.name === 'AbortError') {
            console.log('Fetch aborted');
        } else {
            console.error('Fetch error:', error);
        }
    }
}

function removeExistingRouteLayer(){
    if(map.getSource('route') != null && map.getLayer('route') != null && map.getLayer('arrows') != null){
        map.removeLayer('route');
        map.removeLayer('arrows');
        map.removeSource('route');
    }
}

function startLoadingAnimation(){
    const loadingAnimation = document.getElementById('loadingAnimation');
    if(loadingAnimation.classList.contains('d-none')){ 
        loadingAnimation.classList.remove('d-none');
    }
}

function endLoadingAnimation(){
    const loadingAnimation = document.getElementById('loadingAnimation');
    if(!loadingAnimation.classList.contains('d-none')){ 
        loadingAnimation.classList.add('d-none');
    }
 }

function enableDraggableMarkers() {
    routeType.markerList.forEach(markerDict => {
        if (!markerDict['marker'].dragendListener) {
            markerDict['marker'].setDraggable(true);
            markerDict['marker'].on('dragend', () => {
                const coordinates = [markerDict['marker'].getLngLat().lng, markerDict['marker'].getLngLat().lat];
                markerDict['coordinates'] = coordinates;
                calculateOptimizedRoute(false);
            });
            markerDict['marker'].dragendListener = true;
        }
    });
}

function getWaypointCoordinates(generateButtonClicked){
    let waypointCoords = ``;
    let waypoints = routeType.getAllWaypoints(generateButtonClicked);
    waypoints.forEach(coordinate => {
        waypointCoords = waypointCoords.concat(coordinate[0], ",", coordinate[1], ";");
    });
    waypointCoords = waypointCoords.substring(0, waypointCoords.length - 1);
    return waypointCoords;
}

const clearButtons = document.querySelectorAll(".clear-btn")
clearButtons.forEach(button => {
    button.addEventListener('click', function(event){
        clearForm();
    });
});

function routeDetails(route, elevationGain){
    const distance = route.distance / 1000.0;
    const distanceElem = document.createTextNode(`Distance: ${distance.toFixed(2)} km`);
    const elevationGainElem = document.createTextNode(`Elevation Gain: ${elevationGain.toFixed(0)} m`);
    document.querySelector('.route-details-elements').classList.remove("d-none");
    document.getElementById('route-distance').innerHTML = "";
    document.getElementById('route-distance').appendChild(distanceElem);
    document.getElementById('route-elevation-gain').innerHTML = "";
    document.getElementById('route-elevation-gain').appendChild(elevationGainElem);
}

function addMarkersToMap(){
    routeType.markerList.forEach(markerDict => {
        markerDict['marker'].addTo(map);
    });
}

function clearForm(){
    // add logic to clear all markers and fields of all class objects
    if (routeType != null){
        routeType.clearForm();
    }
    const startingLocationFields = document.querySelectorAll('.startingLocation');
    startingLocationFields.forEach(field => {
       field.value = '';
    });
    const endingLocationFields = document.querySelectorAll('.endingLocation');
    endingLocationFields.forEach(field => {
       field.value = '';
    });
    removeExistingRouteLayer();
    const routeDetails = document.querySelector('.route-details-elements').classList.add("d-none");
}


function capitalize(s)
{
    return s[0].toUpperCase() + s.slice(1);
}


// functions that are being exported. Mostly serves the purpose of random shared helper functions 

export function initializeGeocoders(geocoderList){
    geocoderList.forEach(geocoder => {
        geocoder.on('result', (event) => {
            const coordinates = event.result.geometry.coordinates;
            setMarker(coordinates);
            routeType.curGeocoder = geocoder;
        });
    });
}


export function getPlaceName(coordinates) {
    return new Promise((resolve, reject) => {
        let request = new XMLHttpRequest();
        request.open('GET', `https://api.mapbox.com/geocoding/v5/mapbox.places/${coordinates[0]},${coordinates[1]}.json?access_token=${mapboxgl.accessToken}`);
        request.onload = function() {
            if (this.status >= 200 && this.status < 400) {
                let data = JSON.parse(this.response);
                resolve(data.features[0].place_name);
            } else {
                reject(new Error('Request failed'));
            }
        };
        request.onerror = function() {
            reject(new Error('Request failed'));
        };
        request.send();
    });
}


export function setDraggable(marker, markerDict){
    marker.setDraggable(true);
    marker.on('dragend', () => {
        const coordinates = [marker.getLngLat().lng, marker.getLngLat().lat];
        let placeName = "";
        getPlaceName(coordinates)
            .then(updatedPlaceName => {
                placeName = updatedPlaceName;
                markerDict['marker'] = marker;
                markerDict['coordinates'] = coordinates;
                markerDict['placeName'] = placeName;
                routeType.updateLocationForm(marker, placeName);
            })
            .catch(error => {
                console.error('Error:', error);
            });
    });
}


export function createGeocoder(geocoderLocation){
    let geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        reverseGeocode: true,
        marker: false,
        placeholder: `Enter ${geocoderLocation} Address or Set Point on the Map`
    });
    return geocoder; 
}


export function setGeocoder(geocoder, geocoderLocation){
    let geocoderSection = routeType.form.querySelector(".geocoders");
    if(geocoderSection.querySelector(`.mapboxgl-ctrl-geocoder .${geocoderLocation}`) == null){
        let geocoderElement = geocoder.onAdd(map);
        geocoderSection.appendChild(geocoderElement);
        geocoderElement.classList.add(`${geocoderLocation}`, 'mb-3');
        geocoderElement.querySelector('.mapboxgl-ctrl-geocoder--input').classList.add(`${geocoderLocation}`);
        geocoderElement.addEventListener('click', function(){
            routeType.stackCurrentGeocoderTop(geocoder);
        });
    }
}


export function initializeMarkerAndPopup(curMarkerBuff, coordinates, placeName, markerType){
    if(curMarkerBuff["marker"] != null){
        curMarkerBuff["marker"].remove();
        curMarkerBuff = {};
    }
    curMarkerBuff["marker"] = createMarker(coordinates, placeName, markerType);
    curMarkerBuff["marker"].togglePopup();
    curMarkerBuff["coordinates"] = coordinates;
    curMarkerBuff["placeName"] = placeName;
    return curMarkerBuff;
}


export function createMarker(coordinates, placeName, markerType, addToMap=true){
    let address = placeName != null ? placeName.replace(/^([^,]*,[^,]*).*/, '$1') : "";
    let popup = placeName != null ? new mapboxgl.Popup().setHTML(`<p>${address}</p>`) : new mapboxgl.Popup();
    if(markerType != null){
        popup = new mapboxgl.Popup().setHTML(`
            <div class="center">
                <p style="font-size:0.8rem">${address}</p>
            </div>
            <div class="d-flex justify-content-center">
                <button type="button" class="popupButton btn btn-success ${markerType}Point">Set ${capitalize(markerType)} Point</button>
            </div>
            
        `);
    }
    let marker = new mapboxgl.Marker()
        .setLngLat(coordinates)
        .setPopup(popup);

    if(addToMap){
        marker.addTo(map);
    }
    return marker
}


export function replaceMarker(markerDict, markerBuffDict, newMarker){
    markerBuffDict['marker'].remove();
    if (markerDict != null){
        markerDict['marker'].remove();
    }
    markerDict = {'marker': newMarker, 'coordinates' : markerBuffDict["coordinates"], 'placeName': markerBuffDict["placeName"]};
    return markerDict;
}
