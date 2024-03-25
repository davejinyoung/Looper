import { getPlaceName, setDraggable, createGeocoder, setGeocoder, initializeMarkerAndPopup, createMarker, replaceMarker } from './mapbox.js';

export class RandomLoop{

    constructor(){
        this.curStartMarkerBuff = {}; // current start marker "candidate"
        this.distance; // distance of route
        this.form = document.getElementById('randLoopForm'); // form element of random loop
        this.isGenerated = false; // determines if route has been generated or not
        this.startingGeocoder;
        this.curGeocoder;
    }

    get isCurrentForm(){
        return Object.values(this.form.classList).indexOf('d-none') == -1;
    }

    get allMarkers(){
        return [this.curStartMarker]
    }

    get allGeocoders(){
        return [this.startingGeocoder]
    }

    createInitialGeocoders(){
        this.startingGeocoder = createGeocoder("Starting");
        setGeocoder(this.startingGeocoder, "startingLocation");
    }

    // TODO: Band-aid fix for now, need to refactor this
    stackCurrentGeocoderTop(geocoder){
        return null;
    }

    setMarkerWithCorrectType(coordinates, placeName){
        this.curStartMarkerBuff = initializeMarkerAndPopup(this.curStartMarkerBuff, coordinates, placeName, "starting");
    }

    saveMarker(eventClass){
        if (eventClass.contains('startingPoint')) {
            const startingLocationInputs = this.form.querySelectorAll('.startingLocation');
            startingLocationInputs.forEach(input => {
                input.value = `${this.curStartMarkerBuff['placeName']}`
            });
            this.curStartMarkerBuff['marker'].togglePopup();
        }
    }

    getStartAndEnd(){
        return new Map([
            ['start', this.curStartMarkerBuff['coordinates']]
        ]);
    }

    getAllWaypoints(){
        return [this.curStartMarkerBuff['coordinates']];
    }

    clearForm(){
        this.form.reset();
        if(this.curStartMarkerBuff['marker']){
            this.curStartMarkerBuff['marker'].remove();
            this.curStartMarkerBuff = {};
        }
        this.isGenerated = false;
    }

    enableDraggableMarkers(){
        this.curStartMarkerBuff['marker'].setDraggable(true);
    }
}