import { RandomLoop } from "./random_loop.js";
import { CustomRoute } from "./custom_route.js";

mapboxgl.accessToken = 'pk.eyJ1IjoiZGF2ZWppbnlvdW5nIiwiYSI6ImNscm84czI4ajA3ZHYya2w5c29wZmhwdWsifQ.4EwYfetiww7nb40hQV_RNQ';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [-123.12, 49.28],
    zoom: 10,
    projection: 'mercator'
});

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

let routeType = new RandomLoop();
showForm(routeType.form);
let routeCoordinates = [];
let popupEvent = false;

document.addEventListener('DOMContentLoaded', function () {
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    })
});

document.querySelectorAll('.route-type-dropdown .dropdown-item').forEach(item => {
  item.addEventListener('click', function (e) {
    e.preventDefault(); // Prevent default anchor action
    const selectedValue = this.getAttribute('data-value');
    document.getElementById('dropdownMenuButton').textContent = selectedValue; // Update button text
  });
});

document.addEventListener('DOMContentLoaded', function(){
    const routeDetailsElements = document.querySelector('.route-details-elements');
    const resizeHandle = document.querySelector('.resize-handle');
    const collapseButton = document.querySelector('.collapse-button');

    let isResizing = false;
    let startY, startHeight;
    let newHeight = 150;

    if (resizeHandle) {
        resizeHandle.addEventListener('mousedown', function(e) {
            isResizing = true;
            startY = e.clientY;
            startHeight = parseInt(document.defaultView.getComputedStyle(routeDetailsElements).height, 10);
            document.body.style.cursor = 'ns-resize';
            document.documentElement.style.userSelect = 'none'; // Prevent text selection
        });
    }

    document.addEventListener('mousemove', function(e) {
        if (!isResizing) return;
        newHeight = startHeight + (startY - e.clientY);
        if (newHeight > document.querySelector('#map').clientHeight ) {
            newHeight = document.querySelector('#map').clientHeight;
            return
        };
        if (newHeight < 70) {
            newHeight = 70;
            return;
        }
        routeDetailsElements.style.height = `${newHeight}px`;
        document.getElementById('chart-canvas').style.height = `${newHeight}px`;
    });

    document.addEventListener('mouseup', function() {
        startHeight = parseInt(document.defaultView.getComputedStyle(routeDetailsElements).height, 10);
        isResizing = false;
        document.body.style.cursor = 'default';
        document.documentElement.style.userSelect = ''; // Re-enable text selection
    });

    if (collapseButton) {
        collapseButton.addEventListener('click', function() {
            console.log(routeDetailsElements.style.height)
            if (routeDetailsElements.style.height == '0px') {
                routeDetailsElements.style.height = `${newHeight}px`;
            } else {
                routeDetailsElements.style.height = '0px';
            }
        });
    }
});

var streetButton = document.createElement('streetButton');
streetButton.id = 'street-button';
streetButton.innerHTML = 'Street View';

var satelliteButton = document.createElement('satelliteButton');
satelliteButton.id = 'satellite-button';
satelliteButton.innerHTML = 'Satellite View';

// Add the button to the map container
document.getElementById('map').appendChild(satelliteButton);
document.getElementById('map').appendChild(streetButton);
satelliteButton.addEventListener('click', function() {
    map.setStyle('mapbox://styles/mapbox/satellite-streets-v12');
    satelliteButton.style.display = 'none';
    streetButton.style.display = 'block';
    map.once('styledata', function() {
        if (routeType.isGenerated) {
            addRouteToMap();
        }
    });
});

streetButton.addEventListener('click', function() {
    map.setStyle('mapbox://styles/mapbox/streets-v12');
    streetButton.style.display = 'none';
    satelliteButton.style.display = 'block';
    map.once('styledata', function() {
        if (routeType.isGenerated) {
            addRouteToMap();
        }
    });
});

// Script for selecting the type of route you want to create
document.getElementById('randLoopButton').addEventListener('click', function() {
    if(!(routeType instanceof RandomLoop)){
        clearForm();
        routeType = new RandomLoop();
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

Array.from(document.getElementsByClassName('saveRoute')).forEach(saveRouteButton => {
    saveRouteButton.addEventListener('click', function() {
        saveRoute(getWaypointCoordinates(false), "this is a test");
    });
});

function saveRoute(waypoints, test) {
    let obj = { 'waypoints': waypoints, 'test': test };
    fetch('/save_route/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify(obj)
    });
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        let cookies = document.cookie.split(';');
        for (const element of cookies) {
            let cookie = element.trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}


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
    setGeocoder();
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

// Script for finding current location
geolocateControl.on('geolocate', (event) => {
    const coordinates = [event.coords.longitude, event.coords.latitude];
    if (routeType){
        setMarker(coordinates);
    }
})

// Setting marker on home address
Array.from(document.getElementsByClassName('home-button')).forEach(button => {
    button.addEventListener('click', function() {
        fetch('/api/user_profile/')
        .then(response => response.json())
        .then(data => {
            if (data.address) {
                fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(data.address)}.json?access_token=${mapboxgl.accessToken}`)
                    .then(response => response.json())
                    .then(geocodingData => {
                        if (geocodingData.features && geocodingData.features.length > 0) {
                            const coordinates = geocodingData.features[0].geometry.coordinates;
                            setMarker(coordinates);
                            map.flyTo({
                                center: coordinates,
                                zoom: 15,
                                essential: true
                            });
                        } else {
                            console.error('No results found');
                        }
                    })
                    .catch(error => {
                        console.error('Geocoding request failed:', error);
                    });
            } else {
                alert('Please set your home address in your profile');
            }

        })
        .catch(error => {
            console.error('Error:', error);
        });
    });
});

// Script for location of clicked area on map
map.on('click', (event) => {
    if (popupEvent) {
        popupEvent = false;
        return;
    }
    const coordinates = [event.lngLat.lng, event.lngLat.lat];
    if (routeType){
        setMarker(coordinates);
    }
});

function setMarker(coordinates) {
    getPlaceName(coordinates)
        .then(placeName => {
            routeType.setMarkerWithCorrectType(coordinates, placeName);
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function setPopupListenersForMarkers(markers) {
    markers.forEach(marker => {
        marker.addEventListener('click', function () {
            popupEvent = true;
        });
    });
}

// Script for handling popup button click events
document.body.addEventListener('click', function(event) {
    if (routeType && (event.target.classList.contains('popupButton'))){
        routeType.saveMarker(event.target.classList);
    }
});

// Custom route return to starting point button listener
document.body.addEventListener('click', function(event) {
    if (routeType instanceof CustomRoute && event.target.classList.contains('startingPointLoop')){
        let startingPointMarkerDict = routeType.markerList[0];
        routeType.markerList.push(startingPointMarkerDict);
        startingPointMarkerDict["marker"].togglePopup();
        startingPointMarkerDict["marker"].setPopup(createPopup(startingPointMarkerDict["placeName"]));
        calculateOptimizedRoute(false);
    }   
});

// Function to add event listeners to multiple elements
function addEventListenersToElements(eventType, elements) {
    elements.forEach(element => {
        element['element'].addEventListener(eventType, element['handler']);
    });
}

// Elements to attach the event listener to
const elementsToAttach = [
    {'element': document.getElementById('generateRoute'), 'handler': () => calculateOptimizedRoute()},
    {'element': document.getElementById('runCheck'), 'handler': () => {if (routeType.isGenerated) calculateOptimizedRoute(false)}},
    {'element': document.getElementById('bikeCheck'), 'handler': () => {if (routeType.isGenerated) calculateOptimizedRoute(false)}},
    {'element': document.getElementById('clockwise'), 'handler': () => {if (routeType.isGenerated) 
        routeType.reverseWaypoints(true)
        calculateOptimizedRoute(false);}},
    {'element': document.getElementById('counterClockwise'), 'handler': () => {if (routeType.isGenerated && routeType instanceof RandomLoop) {
        routeType.reverseWaypoints(false);
        calculateOptimizedRoute(false);}}}
];

addEventListenersToElements('click', elementsToAttach);

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
                feature.geometry.coordinates[0], { exaggerated: false }
            );
        }),
        map.queryTerrainElevation(
            chunks[chunks.length - 1].geometry.coordinates[1], { exaggerated: false }
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
        index += 15; // sampling every 15 meters
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

function addRouteToMap() {
    let lineData = {
        type: 'Feature',
        properties: {},
        geometry: {
            type: 'LineString',
            coordinates: routeCoordinates
        }
    };

    // Remove existing source and layers if they exist
    removeExistingRouteLayer();

    // Add the source and layers again
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
            'line-color': '#00b5ad',
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
    });
    
    return lineData;
}

// walkway bias is slowing the generation - may want to obsolete this parameter
export async function calculateOptimizedRoute(generateButtonClicked=true) {
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
        routeCoordinates = route.geometry.coordinates;

        // recursive call to calculateOptimizedRoute if the route is not within the distance margin
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
        setPopupListenersForMarkers(document.querySelectorAll('.mapboxgl-marker'));

        if(generateButtonClicked){
            const bounds = allCoordinates.reduce((bounds, coord) => {
                return bounds.extend(coord);
            }, new mapboxgl.LngLatBounds(allCoordinates[0], allCoordinates[0]));
            map.fitBounds(bounds, {
                padding: { top: 60, bottom: 220, left: 120, right: 120 },
                linear: true,
            });
        }

        let lineData = addRouteToMap();
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
    const distanceElem = `${distance.toFixed(2)} km`;
    const elevationGainElem = `${elevationGain.toFixed(0)} m`;
    document.querySelector('.route-details-elements').classList.remove("d-none");
    document.getElementById('route-distance-value').textContent = distanceElem;
    document.getElementById('route-elevation-gain-value').textContent = elevationGainElem;
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
    document.querySelector('.route-details-elements').classList.add("d-none");
}


function capitalize(s) {
    return s[0].toUpperCase() + s.slice(1);
}


// functions that are being exported. Mostly serves the purpose of random shared helper functions 
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


export function setDraggable(marker, markerDict) {
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


function setGeocoder() {
    let geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        reverseGeocode: true,
        marker: false,
        placeholder: `Enter an Address or Set a Point on the Map`
    });
    let geocoderSection = routeType.form.querySelector(".geocoder");
    if(geocoderSection.querySelector('.mapboxgl-ctrl-geocoder') == null){
        let geocoderElement = geocoder.onAdd(map);
        geocoderSection.appendChild(geocoderElement);
    }
    geocoder.on('result', (event) => {
        const coordinates = event.result.geometry.coordinates;
        setMarker(coordinates);
    });
}


export function initializeMarkerAndPopup(curMarkerBuff, coordinates, placeName, markerType) {
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


export function createPopup(placeName, markerType) {
    let address = placeName != null ? placeName.replace(/^([^,]*,[^,]*).*/, '$1') : "";
    let popupButtonContent = '';

    if (markerType == "starting" || markerType == "additional") {
        popupButtonContent = 
            `<div class="d-flex justify-content-center">
                <button type="button" class="popupButton btn btn-success ${markerType}Point">Set ${capitalize(markerType)} Point</button>
            </div>`;
    }
    else if (markerType == "returnToStart") {
        popupButtonContent = 
            `<div class="d-flex justify-content-center">
                <button type="button" class="popupButton btn btn-success startingPointLoop">Return to Starting Point</button>
            </div>`;
    }

    let popupContent = 
        `<div class="center">
            <p style="font-size:0.8rem">${address}</p>
        </div>` + popupButtonContent;

    return new mapboxgl.Popup().setHTML(popupContent);
}


export function addPopupCloseButtonListener(curMarkerBuff) {
    let popup = curMarkerBuff["marker"].getPopup();
    const closeButton = popup.getElement().querySelector('.mapboxgl-popup-close-button');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            curMarkerBuff["marker"].remove();
        });
    }
}


export function createMarker(coordinates, placeName, markerType, addToMap=true) {
    let popup = createPopup(placeName, markerType);
    let marker = new mapboxgl.Marker()
        .setLngLat(coordinates)
        .setPopup(popup);

    if(addToMap){
        marker.addTo(map);
    }
    setPopupListenersForMarkers(document.querySelectorAll('.mapboxgl-marker'));
    return marker;
}


export function replaceMarker(markerDict, markerBuffDict, newMarker) {
    markerBuffDict['marker'].remove();
    if (markerDict != null){
        markerDict['marker'].remove();
    }
    markerDict = {'marker': newMarker, 'coordinates' : markerBuffDict["coordinates"], 'placeName': markerBuffDict["placeName"]};
    return markerDict;
}


export function removeExistingRouteLayer(){
    if(map.getSource('route') != null && map.getLayer('route') != null && map.getLayer('arrows') != null){
        map.removeLayer('route');
        map.removeLayer('arrows');
        map.removeSource('route');
    }
}