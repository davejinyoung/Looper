import { CustomRoute} from "./custom_route.js";

export class RandomRoute{
    constructor(){
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
        return [this.curStartMarker, this.curEndMarker]
    }

    #isStartingMarker(){
        if (document.getElementById('startingLocation2').value != ''){
            return false;
        }
        return true;
    }

    setMarkerWithCorrectType(coordinates, data, map){
        if (this.#isStartingMarker() == true) {
            this.startingLocation.set("coordinates", coordinates);
            this.startingLocation.set("placeName", data.features[0].place_name);
            if(this.curStartMarker != null){
                this.curStartMarker.remove();
                this.curStartMarker = null;
            }
            const marker = new mapboxgl.Marker()
                .setLngLat(coordinates)
                .setPopup(new mapboxgl.Popup().setHTML(`<p>${this.startingLocation.get("placeName")}</p>
                    <button type="button" class="startingPoint">Set Starting Point</button>`))
                .addTo(map);
            marker.togglePopup();
            this.curStartMarker = marker;
        }
        else {
            this.endingLocation.set("coordinates", coordinates);
            this.endingLocation.set("placeName", data.features[0].place_name);
            if(this.curEndMarker != null){
                this.curEndMarker.remove();
                this.curEndMarker = null;
            }
            const marker = new mapboxgl.Marker()
                .setLngLat(coordinates)
                .setPopup(new mapboxgl.Popup().setHTML(`<p>${this.endingLocation.get("placeName")}</p>
                    <button type="button" class="endingPoint">Set Ending Point</button>`))
                .addTo(map);
            marker.togglePopup();
            this.curEndMarker = marker;
        }
    }

    populateLocationForm(event){
        if (event.target.classList.contains('startingPoint')) {
            const allForms = document.querySelectorAll('form');
            allForms.forEach(form => {
                const startingLocationInputs = form.querySelectorAll('.startingLocation');
                startingLocationInputs.forEach(input => input.value = `${this.startingLocation.get("placeName")}`);
            });
            this.curStartMarker.togglePopup();
        }
        else if (event.target.classList.contains('endingPoint')) {
            const randRouteForm = document.getElementById('randRouteForm');
            randRouteForm.endingLocation.value = `${this.endingLocation.get("placeName")}`
            this.curEndMarker.togglePopup();
        }
    }

    getStartAndEnd(){
        return new Map([
            ['start', this.startingLocation.get("coordinates")],
            ['end', this.endingLocation.get("coordinates")]
        ]);
    }

    getAllWaypoints(){
        return [this.startingLocation.get("coordinates"), this.endingLocation.get("coordinates")];
    }

    clearForm(){
        this.form.reset();
        if(this.curStartMarker){
            this.curStartMarker.remove();
            this.curStartMarker = null;
        }
        this.startingLocation.set('coordinates', null);
        this.startingLocation.set('placeName', null);

        if(this.curEndMarker){
            this.curEndMarker.remove();
            this.curEndMarker = null;
        }
        this.endingLocation.set('coordinates', null);
        this.endingLocation.set('placeName', null);
        this.isGenerated = false;
    }
}