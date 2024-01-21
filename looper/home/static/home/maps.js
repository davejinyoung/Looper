const API_KEY = 'AIzaSyDg9dcCA0yCEzRwXzBD1ug667iSE7PXXB0';

function initMap() {
  const map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 49.2827, lng: -123.1207 },
    zoom: 13,
  });
  const input = document.getElementById("pac-input");
  // Specify just the place data fields that you need.
  const autocomplete = new google.maps.places.Autocomplete(input, {
    fields: ["place_id", "geometry", "formatted_address", "name"],
  });

  autocomplete.bindTo("bounds", map);
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

  const infowindow = new google.maps.InfoWindow();
  const infowindowContent = document.getElementById("infowindow-content");

  infowindow.setContent(infowindowContent);

  const marker = new google.maps.Marker({ map: map });

  marker.addListener("click", () => {
    infowindow.open(map, marker);
  });
  autocomplete.addListener("place_changed", () => {
    infowindow.close();

    const place = autocomplete.getPlace();

    if (!place.geometry || !place.geometry.location) {
      return;
    }

    if (place.geometry.viewport) {
      map.fitBounds(place.geometry.viewport);
    } else {
      map.setCenter(place.geometry.location);
      map.setZoom(17);
    }

    // Set the position of the marker using the place ID and location.
    // @ts-ignore This should be in @typings/googlemaps.
    let data;
    geocode(place.formatted_address).then(data => {
        response.json({ message: 'Request received!', data })
    })
    .catch(err => console.log(err));

    console.log(data);
    marker.setPlace({
      placeId: place.place_id,
      location: place.geometry.location,
    });
    marker.setVisible(true);
    infowindowContent.children.namedItem("place-name").textContent = place.name;
    infowindowContent.children.namedItem("place-id").textContent =
      place.place_id;
    infowindowContent.children.namedItem("coordinates").textContent =
//      coordinates.get('lat');
    infowindow.open(map, marker);
  });
}

async function geocode(location) {
    let coordinates = new Map();
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
            address: location,
            key: API_KEY
        }
    });
    console.log(response.data.results[0].geometry.location.lat);
    return response;
}

window.initMap = initMap;