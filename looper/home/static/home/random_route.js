import { CustomRoute} from "./custom_route.js";


export class RandomRoute{
    constructor(){
        this.markerMap = new Map();
        this.curStartMarkerBuff = {}; // current start marker "candidate"
        this.curEndMarkerBuff = {}; // current end marker "candidate"
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
            if(this.curStartMarkerBuff["marker"] != null){
                this.curStartMarkerBuff["marker"].remove();
                this.curStartMarkerBuff = {};
            }
            this.curStartMarkerBuff["marker"] = new mapboxgl.Marker()
                .setLngLat(coordinates)
                .setPopup(new mapboxgl.Popup().setHTML(`<p>${data.features[0].place_name}</p>
                    <button type="button" class="startingPoint">Set Starting Point</button>`))
                .addTo(map);
            this.curStartMarkerBuff["marker"].togglePopup();
            this.curStartMarkerBuff["coordinates"] = coordinates;
            this.curStartMarkerBuff["placeName"] = data.features[0].place_name;
        }
        else {
            if(this.curEndMarkerBuff["marker"] != null){
                this.curEndMarkerBuff["marker"].remove();
                this.curEndMarkerBuff["marker"] = [];
            }
            this.curEndMarkerBuff["marker"] = new mapboxgl.Marker()
                .setLngLat(coordinates)
                .setPopup(new mapboxgl.Popup().setHTML(`<p>${data.features[0].place_name}</p>
                    <button type="button" class="endingPoint">Set Ending Point</button>`))
                .addTo(map);
            this.curEndMarkerBuff["marker"].togglePopup();
            this.curEndMarkerBuff["coordinates"] = coordinates;
            this.curEndMarkerBuff["placeName"] = data.features[0].place_name;
        }
    }

    saveMarker(event){
        if (event.target.classList.contains('startingPoint')) {
            const allForms = document.querySelectorAll('form');
            this.markerMap.set(this.curStartMarkerBuff["marker"], {"coordinates": this.curStartMarkerBuff["coordinates"], "placeName": this.curStartMarkerBuff["placeName"]});
            allForms.forEach(form => {
                const startingLocationInputs = form.querySelectorAll('.startingLocation');
                startingLocationInputs.forEach(input => input.value = `${this.markerMap.get(this.curStartMarkerBuff["marker"])["placeName"]}`);
            });
            this.curStartMarkerBuff["marker"].togglePopup();
        }
        else if (event.target.classList.contains('endingPoint')) {
            const randRouteForm = document.getElementById('randRouteForm');
            this.markerMap.set(this.curEndMarkerBuff["marker"], {"coordinates": this.curEndMarkerBuff["coordinates"], "placeName": this.curEndMarkerBuff["placeName"]});
            randRouteForm.endingLocation.value = `${this.markerMap.get(this.curEndMarkerBuff["marker"])["placeName"]}`
            this.curEndMarkerBuff["marker"].togglePopup();
        }
    }

    updateLocationForm(coordinates, marker, data){
        if(this.markerMap.get(marker) == this.markerMap.get(this.curStartMarkerBuff["marker"])){
            const allForms = document.querySelectorAll('form');
            allForms.forEach(form => {
                const startingLocationInputs = form.querySelectorAll('.startingLocation');
                startingLocationInputs.forEach(input => input.value = `${data.features[0].place_name}`);
            });
        }
        else {
            const randRouteForm = document.getElementById('randRouteForm');
            randRouteForm.endingLocation.value = `${data.features[0].place_name}`
        }
    }

    getStartAndEnd(){
        return new Map([
            ['start', this.markerMap.get(this.curStartMarkerBuff["marker"])["coordinates"]],
            ['end', this.markerMap.get(this.curEndMarkerBuff["marker"])["coordinates"]]
        ]);
    }

    getAllWaypoints(){
        return [this.markerMap.get(this.curStartMarkerBuff["marker"])["coordinates"], this.markerMap.get(this.curEndMarkerBuff["marker"])["coordinates"]];
    }

    clearForm(){
        this.form.reset();
        if(this.curStartMarkerBuff){
            this.curStartMarkerBuff["marker"].remove();
            this.curStartMarkerBuff = {};
        }
        if(this.curEndMarkerBuff){
            this.curEndMarkerBuff["marker"].remove();
            this.curEndMarkerBuff = {};
        }
        this.markerMap.clear();
        this.isGenerated = false;
    }
}