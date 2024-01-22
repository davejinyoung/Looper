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

map.addControl(
    new mapboxgl.GeolocateControl({
        positionOptions: {
            enableHighAccuracy: true
        },
        // When active the map will receive updates to the device's location as it changes.
        trackUserLocation: true,
        // Draw an arrow next to the location dot to indicate which direction the device is heading.
        showUserHeading: true
    })
);

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