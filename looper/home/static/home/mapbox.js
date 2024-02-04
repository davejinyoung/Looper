mapboxgl.accessToken = 'pk.eyJ1IjoiZGF2ZWppbnlvdW5nIiwiYSI6ImNscm84czI4ajA3ZHYya2w5c29wZmhwdWsifQ.4EwYfetiww7nb40hQV_RNQ';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [-123.12, 49.28],
    zoom: 10,
    projection: 'mercator'
});

let curMarker;
let startingLocation = new Map();
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

// Adds a new marker
function addNewMarker(coordinates) {
    if(curMarker != null){
        curMarker.remove();
    }
    var request = new XMLHttpRequest();
    startingLocation.set("coordinates", coordinates);
    request.open('GET', `https://api.mapbox.com/geocoding/v5/mapbox.places/${coordinates[0]},${coordinates[1]}.json?access_token=${mapboxgl.accessToken}`);
    request.onload = function() {
        if (this.status >= 200 && this.status < 400) {
            var data = JSON.parse(this.response);
            startingLocation.set("placeName", data.features[0].place_name);
            const marker = new mapboxgl.Marker()
                .setLngLat(coordinates)
                .setPopup(new mapboxgl.Popup().setHTML(`<p>${startingLocation.get("placeName")}</p>
                    <button type="button" class="startingPoint">Set Starting Point</button>`))
                .addTo(map);
            marker.togglePopup();
            curMarker = marker;
        }
    };
    request.send();
}

document.body.addEventListener('click', function(event) {
    if (event.target.classList.contains('startingPoint')) {
        const allForms = document.querySelectorAll('form');
        allForms.forEach(form => {
            const startingLocationInputs = form.querySelectorAll('.startingLocation');
            startingLocationInputs.forEach(input => input.value = `${startingLocation.get("placeName")}`);
        });
    }
});

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
    calculateOptimizedRoute(startingLocation.get('coordinates'))
});

function calculateOptimizedRoute(start) {
    const queryURL = `https://api.mapbox.com/optimized-trips/v1/mapbox/walking/${start[0]},${start[1]};-123.310659,48.4647795?overview=full&steps=true&geometries=geojson&source=first&access_token=${mapboxgl.accessToken}`;

    fetch(queryURL)
      .then(response => response.json())
      .then(data => {
        const optimizedRoute = turf.featureCollection([turf.feature(data.trips[0].geometry)]);
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