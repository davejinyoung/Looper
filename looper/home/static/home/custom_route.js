export class CustomRoute{
    constructor(){
        this.curStartMarker;
        this.curAdditionalMarker;
        this.startingLocation = new Map();
        this.additionalLocation = new Map();
        this.form = document.getElementById('customRouteForm');
        this.waypoints = [];
    }

    get isCurrentForm(){
        if (Object.values(this.form.classList).indexOf('d-none') == -1){
            return true;
        }
        return false;
    }

    #isStartingMarker(){
        if (document.getElementById('startingLocation3').value != ''){
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
            this.additionalLocation.set("coordinates", coordinates);
            this.additionalLocation.set("placeName", data.features[0].place_name);
            if(this.curAdditionalMarker != null){
                this.curAdditionalMarker.remove();
                this.curAdditionalMarker = null;
            }
            const marker = new mapboxgl.Marker()
                .setLngLat(coordinates)
                .setPopup(new mapboxgl.Popup().setHTML(`<p>${this.additionalLocation.get("placeName")}</p>
                    <button type="button" class="additionalPoint">Set Additional Point</button>`))
                .addTo(map);
            marker.togglePopup();
            this.curAdditionalMarker = marker;
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
            this.waypoints.push(this.startingLocation.get("coordinates"));
        }
        else if (event.target.classList.contains('additionalPoint')) {
            this.waypoints.push(this.additionalLocation.get("coordinates"));
            this.curAdditionalMarker.togglePopup();
        }
    }

    getStartAndEnd(){
        let start = this.waypoints[0];
        let end = this.waypoints[this.waypoints.length - 1];
        return new Map([
            ['start', start],
            ['end', end]
        ]);
    }

    getAllWaypoints(){
        return this.waypoints;
    }

    clearForm(){
        this.form.reset();
        if(this.curStartMarker){
            this.curStartMarker.remove();
            this.curStartMarker = null;
        }
        this.startingLocation.set('coordinates', null);
        this.startingLocation.set('placeName', null);

        if(this.curAdditionalMarker){
            this.curAdditionalMarker.remove();
            this.curAdditionalMarker = null;
        }
        this.additionalLocation.set('coordinates', null);
        this.additionalLocation.set('placeName', null);
        this.waypoints = [];
    }
}