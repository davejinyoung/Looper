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

        marker.setPlace({
            placeId: place.place_id,
            location: place.geometry.location,
        });
        marker.setVisible(true);
        infowindowContent.children.namedItem("place-name").textContent = place.name;
        infowindowContent.children.namedItem("place-id").textContent =
            place.place_id;

        geocode(place.formatted_address).then((coordinates) => {
            infowindowContent.children.namedItem("coordinates").textContent =
                `${coordinates.lat}, ${coordinates.lng}`;
            infowindow.open(map, marker);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    });
}

const geocode = async (location) => {
    try {
        const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
            params: {
                address: location,
                key: API_KEY
            }
        });
        const coordinates = {
            lat: response.data.results[0].geometry.location.lat,
            lng: response.data.results[0].geometry.location.lng,
        };
        console.log('Inside fetchData:', coordinates); // Log the coordinates inside the function
        return coordinates;
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
};

window.initMap = initMap;