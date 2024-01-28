mapboxgl.accessToken = 'pk.eyJ1IjoiZGF2ZWppbnlvdW5nIiwiYSI6ImNscm84czI4ajA3ZHYya2w5c29wZmhwdWsifQ.4EwYfetiww7nb40hQV_RNQ';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [-123.12, 49.28],
    zoom: 10,
});

let curMarker;
let geolocationActive = false;

// Script for searching for location
const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl,
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

// Script for location of clicked area on map
geolocateControl.on('geolocate', (event) => {
    const coordinates = [event.coords.longitude, event.coords.latitude];
    addNewMarker(coordinates);
});
map.on('click', (event) => {
    const coordinates = [event.lngLat.lng, event.lngLat.lat];
    addNewMarker(coordinates);
});

// Adds a new marker
function addNewMarker(coordinates) {
    if(curMarker != null){
        curMarker.remove();
    }
    const marker = new mapboxgl.Marker()
        .setLngLat(coordinates)
        .setPopup(new mapboxgl.Popup().setHTML(`<p>${coordinates}</p>`))
        .addTo(map);
    marker.togglePopup();
    curMarker = marker;
}