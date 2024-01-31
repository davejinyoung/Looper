mapboxgl.accessToken = 'pk.eyJ1IjoiZGF2ZWppbnlvdW5nIiwiYSI6ImNscm84czI4ajA3ZHYya2w5c29wZmhwdWsifQ.4EwYfetiww7nb40hQV_RNQ';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [-123.12, 49.28],
    zoom: 10,
    projection: 'mercator'
});

let curMarker;
let placeName;
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
    request.open('GET', `https://api.mapbox.com/geocoding/v5/mapbox.places/${coordinates[0]},${coordinates[1]}.json?access_token=${mapboxgl.accessToken}`);
    request.onload = function() {
        if (this.status >= 200 && this.status < 400) {
            var data = JSON.parse(this.response);
            placeName = data.features[0].place_name
            const marker = new mapboxgl.Marker()
                .setLngLat(coordinates)
                .setPopup(new mapboxgl.Popup().setHTML(`<p>${placeName}</p>
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
        console.log("success");
        document.getElementById('startingLocation').value = "";
        document.getElementById('startingLocation').value += `${placeName}`;
    }
});