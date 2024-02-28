import { CustomRoute} from "./custom_route.js";

mapboxgl.accessToken = 'pk.eyJ1IjoiZGF2ZWppbnlvdW5nIiwiYSI6ImNscm84czI4ajA3ZHYya2w5c29wZmhwdWsifQ.4EwYfetiww7nb40hQV_RNQ';

export class RandomRoute{
    constructor(){
        this.markerMap = new Map();
        this.curStartMarker; // current start marker "candidate"
        this.curEndMarker; // current end marker "candidate"
        this.startingLocation = new Map(); // starting location details. Stores placeName and coordinates
        this.endingLocation = new Map(); // ending location details. Stores placeName and coordinates
        this.form = document.getElementById('randRouteForm'); // form element of random route
        this.isGenerated = false; // determines if route has been generated or not
    }

    get isCurrentForm(){
        if (Object.values(this.form.classList).indexOf('d-none') == -1){
            return true;
        }
        return false;
    }

    get allMarkers(){
        return Array.from(this.markerMap.keys());
    }

    #isStartingMarker(){
        if (document.getElementById('startingLocation2').value != ''){
            return false;
        }
        return true;
    }

    setMarkerWithCorrectType(coordinates, data, map){
        if (this.#isStartingMarker() == true) {
            if(this.curStartMarker != null){
                this.markerMap.delete(this.curStartMarker);
                this.curStartMarker.remove();
                this.curStartMarker = null;
            }
            this.curStartMarker = new mapboxgl.Marker()
                .setLngLat(coordinates)
                .setPopup(new mapboxgl.Popup().setHTML(`<p>${data.features[0].place_name}</p>
                    <button type="button" class="startingPoint">Set Starting Point</button>`))
                .addTo(map);
            this.curStartMarker.togglePopup();
            this.markerMap.set(this.curStartMarker, {"coordinates": coordinates, "placeName": data.features[0].place_name});
        }
        else {
            if(this.curEndMarker != null){
                this.markerMap.delete(this.curEndMarker);
                this.curEndMarker.remove();
                this.curEndMarker = null;
            }
            this.curEndMarker = new mapboxgl.Marker()
                .setLngLat(coordinates)
                .setPopup(new mapboxgl.Popup().setHTML(`<p>${data.features[0].place_name}</p>
                    <button type="button" class="endingPoint">Set Ending Point</button>`))
                .addTo(map);
            this.curEndMarker.togglePopup();
            this.markerMap.set(this.curEndMarker, {"coordinates": coordinates, "placeName": data.features[0].place_name});
        }
    }

    populateLocationForm(event){
        if (event.target.classList.contains('startingPoint')) {
            const allForms = document.querySelectorAll('form');
            allForms.forEach(form => {
                const startingLocationInputs = form.querySelectorAll('.startingLocation');
                startingLocationInputs.forEach(input => input.value = `${this.markerMap.get(this.curStartMarker)["placeName"]}`);
            });
            this.curStartMarker.togglePopup();
        }
        else if (event.target.classList.contains('endingPoint')) {
            const randRouteForm = document.getElementById('randRouteForm');
            randRouteForm.endingLocation.value = `${this.markerMap.get(this.curEndMarker)["placeName"]}`
            this.curEndMarker.togglePopup();
        }
    }

    updateLocationForm(coordinates, marker){
        var request = new XMLHttpRequest();
        request.open('GET', `https://api.mapbox.com/geocoding/v5/mapbox.places/${coordinates[0]},${coordinates[1]}.json?access_token=${mapboxgl.accessToken}`);

        // TODO: Heavy clean-up. Funtionality is working though.
        let startingLoc;
        if(this.markerMap.get(marker) == this.markerMap.get(this.curStartMarker)){
            startingLoc = true;
        }
        else {
            startingLoc = false;
        }
        const randRouteForm = document.getElementById('randRouteForm');
        request.onload = function() {
            if (this.status >= 200 && this.status < 400) {
                var data = JSON.parse(this.response);
                if(startingLoc){
                    const allForms = document.querySelectorAll('form');
                    allForms.forEach(form => {
                        const startingLocationInputs = form.querySelectorAll('.startingLocation');
                        startingLocationInputs.forEach(input => input.value = `${data.features[0].place_name}`);
                    });
                }
                else{
                    const randRouteForm = document.getElementById('randRouteForm');
                    randRouteForm.endingLocation.value = `${data.features[0].place_name}`
                }

            }
        };
        request.send();
    }

    getStartAndEnd(){
        return new Map([
            ['start', this.markerMap.get(this.curStartMarker)["coordinates"]],
            ['end', this.markerMap.get(this.curEndMarker)["coordinates"]]
        ]);
    }

    getAllWaypoints(){
        return [this.markerMap.get(this.curStartMarker)["coordinates"], this.markerMap.get(this.curEndMarker)["coordinates"]];
    }

    clearForm(){
        this.form.reset();
        if(this.curStartMarker){
            this.curStartMarker.remove();
            this.curStartMarker = null;
        }
        if(this.curEndMarker){
            this.curEndMarker.remove();
            this.curEndMarker = null;
        }
        this.markerMap.clear();
        this.isGenerated = false;
    }
}