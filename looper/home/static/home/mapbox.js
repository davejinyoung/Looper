mapboxgl.accessToken = 'pk.eyJ1IjoiZGF2ZWppbnlvdW5nIiwiYSI6ImNscm84czI4ajA3ZHYya2w5c29wZmhwdWsifQ.4EwYfetiww7nb40hQV_RNQ';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [-123.12, 49.28],
    zoom: 10,
    projection: 'mercator'
});

let curStartMarker;
let curEndMarker;
let startingLocation = new Map();
let endingLocation = new Map();
let geolocationActive = false;

// Script for searching for location
const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl,
    reverseGeocode: true,
    placeholder: "Enter Starting Address Here"
});
map.addControl(geocoder, 'top-left');
geocoder.on('result', (event) => {
    const coordinates = event.result.geometry.coordinates;
    addNewMarker(coordinates);
    geocoder.clear();
});

// Script for finding current location
const geolocateControl = new mapboxgl.GeolocateControl({
    positionOptions: {
        enableHighAccuracy: true
    },
    trackUserLocation: true,
    showUserHeading: true
});
map.addControl(geolocateControl);
document.getElementById('btn-check').addEventListener('click', function(event) {
    geolocateControl.trigger();
});
geolocateControl.on('geolocate', (event) => {
    const coordinates = [event.coords.longitude, event.coords.latitude];
    addNewMarker(coordinates);
});

// Script for location of clicked area on map
map.on('click', (event) => {
    const coordinates = [event.lngLat.lng, event.lngLat.lat];
    addNewMarker(coordinates);
});

// Script to adds a new marker. Helper function below
function addNewMarker(coordinates) {
    let randRouteFormList = Object.values(document.getElementById('randRouteForm').classList);
    if (document.getElementById('startingLocation2').value != '' && randRouteFormList.indexOf('d-none') == -1){
        setMarker(coordinates, false);
    }
    else {
        setMarker(coordinates);
    }
}

function setMarker(coordinates, startMarker = true) {
    var request = new XMLHttpRequest();
    request.open('GET', `https://api.mapbox.com/geocoding/v5/mapbox.places/${coordinates[0]},${coordinates[1]}.json?access_token=${mapboxgl.accessToken}`);
    request.onload = function() {
        if (this.status >= 200 && this.status < 400) {
            var data = JSON.parse(this.response);
            if(startMarker) {
                startingLocation.set("coordinates", coordinates);
                startingLocation.set("placeName", data.features[0].place_name);
                if(curStartMarker != null){
                    curStartMarker.remove();
                }
                const marker = new mapboxgl.Marker()
                    .setLngLat(coordinates)
                    .setPopup(new mapboxgl.Popup().setHTML(`<p>${startingLocation.get("placeName")}</p>
                        <button type="button" class="startingPoint">Set Starting Point</button>`))
                    .addTo(map);
                marker.togglePopup();
                curStartMarker = marker;
            }
            else {
                endingLocation.set("coordinates", coordinates);
                endingLocation.set("placeName", data.features[0].place_name);
                if(curEndMarker != null){
                    curEndMarker.remove();
                }
                const marker = new mapboxgl.Marker()
                    .setLngLat(coordinates)
                    .setPopup(new mapboxgl.Popup().setHTML(`<p>${endingLocation.get("placeName")}</p>
                        <button type="button" class="endingPoint">Set Ending Point</button>`))
                    .addTo(map);
                marker.togglePopup();
                curEndMarker = marker;
            }
        }
    };
    request.send();
}

// Script to add an ending location
document.body.addEventListener('click', function(event) {
    if (event.target.classList.contains('startingPoint')) {
        const allForms = document.querySelectorAll('form');
        allForms.forEach(form => {
            const startingLocationInputs = form.querySelectorAll('.startingLocation');
            startingLocationInputs.forEach(input => input.value = `${startingLocation.get("placeName")}`);
        });
        curStartMarker.togglePopup();
    }
    else if (event.target.classList.contains('endingPoint')) {
        const randRouteForm = document.getElementById('randRouteForm');
        randRouteForm.endingLocation.value = `${endingLocation.get("placeName")}`
        curEndMarker.togglePopup();
    }
});

// Script for selecting the type of route you want to create
document.getElementById('randLoopButton').addEventListener('click', function(event) {
    showForm('randLoopForm');
});
document.getElementById('randRouteButton').addEventListener('click', function(event) {
    showForm('randRouteForm');
});
document.getElementById('customRouteButton').addEventListener('click', function(event) {
    showForm('customRouteForm');
});

function showForm(formId) {
    // Hide all forms
    const allForms = document.querySelectorAll('form');
    allForms.forEach(form => form.classList.add('d-none'));

    // Show the selected form
    const selectedForm = document.getElementById(formId);
    if (selectedForm) {
        selectedForm.classList.remove('d-none');
    }
}

document.getElementById("submit-rand-loop").addEventListener('click', function(event) {
    calculateOptimizedRoute(startingLocation.get('coordinates'));
});

document.getElementById("submit-rand-route").addEventListener('click', function(event) {

    calculateOptimizedRoute(startingLocation.get('coordinates'), endingLocation.get('coordinates'))
});

function calculateOptimizedRoute(start, end = []) {
    let endCoordinates = [-123.310659, 48.4647795]
    if (end.length == 0){
        end = endCoordinates;
        console.log(endCoordinates);
    }
    const queryURL = `https://api.mapbox.com/optimized-trips/v1/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?&overview=full&annotations=duration,distance&steps=true&geometries=geojson&source=first&destination=last&roundtrip=false&access_token=${mapboxgl.accessToken}`;

    fetch(queryURL)
        .then(response => response.json())
        .then(data => {
            const optimizedRoute = turf.featureCollection([turf.feature(data.trips[0].geometry)]);
            const optimizedRouteDistance = turf.featureCollection([turf.feature(data.trips[0].distance)]);
            console.log(data.trips[0].legs[0].distance);
            map.addSource('route', { type: 'geojson', data: optimizedRoute });
            map.addLayer({
                id: 'optimized-route',
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