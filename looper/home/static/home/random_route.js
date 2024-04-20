import { getPlaceName, setDraggable, createGeocoder, setGeocoder, initializeMarkerAndPopup, createMarker, replaceMarker } from './mapbox.js';

export class RandomRoute{

    constructor(){
        this.markerList = [];
        this.curStartMarkerBuff = {}; // current start marker "candidate"
        this.curEndMarkerBuff = {}; // current end marker "candidate"
        this.form = document.getElementById('randRouteForm'); // form element of random route
        this.isGenerated = false; // determines if route has been generated or not
        this.startingGeocoder;
        this.endingGeocoder;
        this.curGeocoder;
    }


    get isCurrentForm(){
        return Object.values(this.form.classList).indexOf('d-none') == -1;
    }


    get allMarkers(){
        return this.retrieveMarkers()
    }


    validateFormSubmission(){
        if(this.form.querySelector('.mapboxgl-ctrl-geocoder .startingLocation').value == ''){
            alert('Please enter a valid starting location');
            return false;
        }
        if(this.form.querySelector('.mapboxgl-ctrl-geocoder .endingLocation').value == ''){
            alert('Please enter a valid ending location');
            return false;
        }
        return true;
    }


    retrieveMarkers(){
        let markers = [];
        this.markerList.forEach(markerElement => {
            markers.push(markerElement['marker']);
        });
        return markers;
    }

    get allGeocoders(){
        return [this.startingGeocoder, this.endingGeocoder]
    }


    createInitialGeocoders(){
        this.startingGeocoder = createGeocoder("Starting");
        setGeocoder(this.startingGeocoder, "startingLocation");

        this.endingGeocoder = createGeocoder("Ending");
        setGeocoder(this.endingGeocoder, "endingLocation");
    }

    // TODO: Band-aid fix for now, need to refactor this
    stackCurrentGeocoderTop(){
        let startingGeocoderSection = this.form.querySelector(`.mapboxgl-ctrl-geocoder .startingLocation`).parentElement;
        startingGeocoderSection.style.zIndex = '';
        let endingGeocoderSection = this.form.querySelector(`.mapboxgl-ctrl-geocoder .endingLocation`).parentElement;
        endingGeocoderSection.style.zIndex = '';
        let newGeocoderSection = document.activeElement.parentElement;
        newGeocoderSection.style.zIndex = '10';
    }


    #isStartingMarker(){
        if(this.curGeocoder != null) {
            if(this.curGeocoder.container.classList.contains('startingLocation')){
                return true;
            }
            else if(this.curGeocoder.container.classList.contains('endingLocation')){
                return false;
            }
        }
        
        else if(this.form.querySelector('.mapboxgl-ctrl-geocoder .startingLocation').value == ''){
            return true;
        }
        else {
            return false;
        }
    }


    setMarkerWithCorrectType(coordinates, placeName){
        if (this.#isStartingMarker()) {
            this.curStartMarkerBuff = initializeMarkerAndPopup(this.curStartMarkerBuff, coordinates, placeName, "starting");
        }
        else {
            this.curEndMarkerBuff = initializeMarkerAndPopup(this.curEndMarkerBuff, coordinates, placeName, "ending");
        }
    }


    handleMarker(markerBuffer, geocoder, markerIndex, inputClass) {
        const marker = createMarker(markerBuffer["coordinates"], markerBuffer["placeName"]);
        if(this.curGeocoder == geocoder){
            this.markerList[markerIndex] = replaceMarker(this.markerList[markerIndex], markerBuffer, marker);
            setDraggable(marker, this.markerList[markerIndex]);
        }
        else if(!this.isGenerated) {
            markerBuffer["marker"].remove();
            let markerValues = {'marker': marker, 'coordinates' : markerBuffer["coordinates"], 'placeName': markerBuffer["placeName"]};
            this.markerList[markerIndex] = markerValues;
            setDraggable(marker, this.markerList[markerIndex]);
        }
        const locationInputs = this.form.querySelectorAll(inputClass);
        locationInputs.forEach(input => {
            input.value = `${markerBuffer["placeName"]}`
        });
        markerBuffer["marker"].togglePopup();
    }
    

    saveMarker(eventClass){
        if (eventClass.contains('startingPoint')) {
            this.handleMarker(this.curStartMarkerBuff, this.startingGeocoder, 0, '.startingLocation');
        }
        else if (eventClass.contains('endingPoint')) {
            this.handleMarker(this.curEndMarkerBuff, this.endingGeocoder, 1, '.endingLocation');
        }
        this.curGeocoder = null;
    }


    updateLocationForm(marker, placeName){
        marker.setPopup(new mapboxgl.Popup().setHTML(`<p>${placeName}</p>`))
        if(marker == this.markerList[0]['marker']){
            const allForms = document.querySelectorAll('form');
            allForms.forEach(form => {
                const startingLocationInputs = form.querySelectorAll('.startingLocation');
                startingLocationInputs.forEach(input => input.value = `${placeName}`);
            });
        }
        else {
            const randRouteForm = document.getElementById('randRouteForm');
            randRouteForm.querySelector('.mapboxgl-ctrl-geocoder .endingLocation').value = `${placeName}`;
        }
    }


    getMarkerDetailsByMarker(marker){
        this.markerList.forEach(markerDict => {
            if(markerDict['marker'] == marker){
                return markerDict;
            }
        });
        return null;
    }


    getStartAndEnd(){
        let start = this.markerList[0]['coordinates'];
        let end = this.markerList[1]['coordinates'];
        return new Map([
            ['start', start],
            ['end', end]
        ]);
    }


    getAllWaypoints(generateButtonClicked){
        return [this.markerList[0]['coordinates'], this.markerList[1]['coordinates']];
    }


    clearForm(){
        this.form.reset();
        if(this.curStartMarkerBuff["marker"]){
            this.curStartMarkerBuff["marker"].remove();
            this.curStartMarkerBuff = {};
        }
        if(this.curEndMarkerBuff["marker"]){
            this.curEndMarkerBuff["marker"].remove();
            this.curEndMarkerBuff = {};
        }
        for(let marker of this.retrieveMarkers()){
            marker.remove();
        }
        this.markerList = [];
        this.isGenerated = false;
    }
}