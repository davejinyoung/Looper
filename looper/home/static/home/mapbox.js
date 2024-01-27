mapboxgl.accessToken = 'pk.eyJ1IjoiZGF2ZWppbnlvdW5nIiwiYSI6ImNscm84czI4ajA3ZHYya2w5c29wZmhwdWsifQ.4EwYfetiww7nb40hQV_RNQ';

const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/mapbox/streets-v12', // style URL
    center: [-123.12, 49.28], // starting position [lng, lat]
    zoom: 10, // starting zoom
});

map.addControl(
    new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl
    }),
    'top-left'
);

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



let curMarker;
map.on('click', evt => {
    console.log(evt.lngLat);
    if(curMarker != null){
        curMarker.remove();
    }
    const marker = new mapboxgl.Marker()
        .setLngLat([evt.lngLat.lng, evt.lngLat.lat])
        .setPopup(new mapboxgl.Popup().setHTML(`<p>Latitude is: ${evt.lngLat.lat}, Longitude is: ${evt.lngLat.lng}</p>`)) // add popup
        .addTo(map);
    marker.togglePopup();
    curMarker = marker;
});