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


function showForm(selectedForm) {
    // Hide all forms
    const allForms = document.querySelectorAll('form');
    allForms.forEach(form => form.classList.add('d-none'));

    // Show the selected form
    if(selectedForm){
        selectedForm.classList.remove('d-none');
    }
    document.getElementById("universalFormItems").classList.remove('d-none');
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

// TODO: clean this up
const generateButtonIds = ["submit-rand-loop", "submit-rand-route", "submit-cust-route"] 
generateButtonIds.forEach(buttonId => {
    document.getElementById(`${buttonId}`).addEventListener('click', function(event) {
        calculateOptimizedRoute();
        enableDraggableMarkers();
    });
});

// walkway bias is slowing the generation - may want to obsolete this parameter
function calculateOptimizedRoute(generateButtonClicked=true) {
    let exerciseType = document.getElementById('runCheck').checked ? 'walking' : 'cycling';
    let walkwayBias = document.getElementById('runCheck').checked ? 'walkway_bias=0.35' : '';
    const waypointLiteral = getWaypointLiteral();
    const queryURL = `https://api.mapbox.com/directions/v5/mapbox/${exerciseType}/${waypointLiteral}?&alternatives=true&annotations=distance&continue_straight=false&${walkwayBias}&geometries=geojson&overview=full&steps=true&access_token=${mapboxgl.accessToken}`;

    fetch(queryURL)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const routes = data.routes;
            const allCoordinates = routes.reduce((acc, route) => {
                return acc.concat(route.geometry.coordinates);
            }, []);

            if(generateButtonClicked){
                const bounds = allCoordinates.reduce((bounds, coord) => {
                    return bounds.extend(coord);
                }, new mapboxgl.LngLatBounds(allCoordinates[0], allCoordinates[0]));
                map.fitBounds(bounds, {
                    padding: 40,
                    linear: true
                });
            }

            const route = data.routes[0];
            const routeCoordinates = route.geometry.coordinates;
            routeDetails(route);
            routeType.isGenerated = true;

            if(map.getSource('route') != null && map.getLayer('route') != null){
                map.removeLayer('route')
                map.removeSource('route');
            }

            map.addSource('route', { type: 'geojson', data: {
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'LineString',
                    coordinates: routeCoordinates
                }
            }});
            map.addLayer({
                id: 'route',
                type: 'line',
                source: 'route',
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-color': '#3887be',
                    'line-width': 5
                }
            });
        })
        .catch(error => console.error('Error:', error));
}

function enableDraggableMarkers(){
    routeType.markerList.forEach(markerDict => {
        markerDict['marker'].setDraggable(true);
        markerDict['marker'].on('dragend', () => {
            const coordinates = [markerDict['marker'].getLngLat().lng, markerDict['marker'].getLngLat().lat];
            markerDict['coordinates'] = coordinates;
            calculateOptimizedRoute(false);
            setMarker(coordinates, markerDict['marker']);
        })
    })
}

function getWaypointLiteral(){
    let waypointLiteral = ``;
    let waypoints = routeType.getAllWaypoints();
    waypoints.forEach(coordinate => {
        waypointLiteral = waypointLiteral.concat(coordinate[0], ",", coordinate[1], ";");
    });
    waypointLiteral = waypointLiteral.substring(0, waypointLiteral.length - 1);
    return waypointLiteral;
}

const clearButtons = document.querySelectorAll(".clear-btn")
clearButtons.forEach(button => {
    button.addEventListener('click', function(event){
        clearForm();
    });
});

function routeDetails(route){
    const distance = route.distance / 1000.00;
    const distanceElem = document.createTextNode(`${distance.toFixed(2)} km`);
    const routeDetails = document.getElementById('route-distance');
    routeDetails.innerHTML = "";
    routeDetails.appendChild(distanceElem);
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
    if(map.getSource('route') != null && map.getLayer('route') != null){
        map.removeLayer('route')
        map.removeSource('route');
    }
    const routeDetails = document.getElementById('route-distance');
    routeDetails.innerHTML = "";
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


export function createMarker(coordinates, placeName, markerType){
    let popup = new mapboxgl.Popup().setHTML(`<p>${placeName}</p>`);
    if(markerType != null){
        popup = new mapboxgl.Popup().setHTML(`<p>${placeName}</p>
            <button type="button" class="popupButton ${markerType}Point">Set ${capitalize(markerType)} Point</button>`);
    }

    return new mapboxgl.Marker()
        .setLngLat(coordinates)
        .setPopup(popup)
        .addTo(map);
}


export function replaceMarker(markerDict, markerBuffDict, newMarker){
    markerBuffDict['marker'].remove();
    if (markerDict != null){
        markerDict['marker'].remove();
    }
    markerDict = {'marker': newMarker, 'coordinates' : markerBuffDict["coordinates"], 'placeName': markerBuffDict["placeName"]};
    return markerDict;
}
