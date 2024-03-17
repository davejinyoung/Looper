export class RandomLoop{
    constructor(){
        this.curStartMarker; // current start marker "candidate"
        this.distance; // distance of route
        this.startingLocation = new Map(); // starting location details. Stores placeName and coordinates
        this.form = document.getElementById('randLoopForm'); // form element of random loop
        this.isGenerated = false; // determines if route has been generated or not
        this.startingGeocoder;
        this.curGeocoder;
    }

    get isCurrentForm(){
        if (Object.values(this.form.classList).indexOf('d-none') == -1){
            return true;
        }
        return false;
    }

    get allMarkers(){
        return [this.curStartMarker]
    }

    get allGeocoders(){
        return [this.startingGeocoder]
    }

    createInitialGeocoders(map, token){
        let geocoderSection = this.form.querySelector(".geocoders");
        this.startingGeocoder = new MapboxGeocoder({
            accessToken: token,
            mapboxgl: mapboxgl,
            reverseGeocode: true,
            marker: false,
            placeholder: "Enter Starting Address or Set Point on the Map"
        });
        if(geocoderSection.querySelector('.mapboxgl-ctrl-geocoder') == null){
            geocoderSection.appendChild(this.startingGeocoder.onAdd(map));
            geocoderSection.querySelector('.mapboxgl-ctrl-geocoder').classList.add('startingLocation', 'mb-3');
            geocoderSection.querySelector('.mapboxgl-ctrl-geocoder--input').classList.add('startingLocation');
        }
    }

    setMarkerWithCorrectType(coordinates, data, map){
        this.startingLocation.set("coordinates", coordinates);
        this.startingLocation.set("placeName", data.features[0].place_name);
        if(this.curStartMarker != null){
            this.curStartMarker.remove();
            this.curStartMarker = null;
        }
        const marker = new mapboxgl.Marker()
            .setLngLat(coordinates)
            .setPopup(new mapboxgl.Popup().setHTML(`<p>${this.startingLocation.get("placeName")}</p>
                <button type="button" class="popupButton startingPoint">Set Starting Point</button>`))
            .addTo(map);
        marker.togglePopup();
        this.curStartMarker = marker;
    }

    saveMarker(event){
        if (event.target.classList.contains('startingPoint')) {
            const startingLocationInputs = this.form.querySelectorAll('.startingLocation');
            startingLocationInputs.forEach(input => {
                input.value = `${this.startingLocation.get("placeName")}`
            });
            this.curStartMarker.togglePopup();
        }
    }

    getStartAndEnd(){
        return new Map([
            ['start', this.startingLocation.get("coordinates")]
        ]);
    }

    getAllWaypoints(){
        return [this.startingLocation.get("coordinates")];
    }

    clearForm(){
        this.form.reset();
        if(this.curStartMarker){
            this.curStartMarker.remove();
            this.curStartMarker = null;
        }
        this.startingLocation.set('coordinates', null);
        this.startingLocation.set('placeName', null);
        this.isGenerated = false;
    }

    enableDraggableMarkers(){
        this.curStartMarker.setDraggable(true);
    }
}