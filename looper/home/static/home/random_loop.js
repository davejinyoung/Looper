export class RandomLoop{
    constructor(){
        this.curStartMarker;
        this.distance;
        this.startingLocation = new Map();
        this.form = document.getElementById('randLoopForm');
    }

    get isCurrentForm(){
        if (Object.values(this.form.classList).indexOf('d-none') == -1){
            return true;
        }
        return false;
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
                <button type="button" class="startingPoint">Set Starting Point</button>`))
            .addTo(map);
        marker.togglePopup();
        this.curStartMarker = marker;
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
    }
}