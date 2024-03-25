import { getPlaceName, setDraggable, createGeocoder, initializeGeocoders, setGeocoder, initializeMarkerAndPopup, createMarker, replaceMarker } from './mapbox.js';

export class CustomRoute {
    
    constructor(){
        this.markerList = []; // Replacement of markerMap 
        
        this.curStartMarkerBuff = {}; // current start marker "candidate"
        this.curAdditionalMarkerBuff = {}; // current additional marker "candidate"
        this.form = document.getElementById('customRouteForm'); // form element of custom route
        this.isGenerated = false; // determines if route has been generated or not
        this.startingGeocoder;
        this.curGeocoder;
        this.additionalGeocoders = []; // might want to change this name to allGeocoders since it includes the starting Geocoder
        this.countAdditionalLocations = 0;
    }


    get isCurrentForm(){
        return Object.values(this.form.classList).indexOf('d-none') == -1;
    }


    get allMarkers(){
        return this.retrieveMarkers()
    }


    retrieveMarkers(){
        let markers = [];
        this.markerList.forEach(markerElement => {
            markers.push(markerElement['marker']);
        });
        return markers;
    }


    get allGeocoders(){
        return this.additionalGeocoders;
    }


    createInitialGeocoders(){
        this.startingGeocoder = createGeocoder("Starting");
        this.additionalGeocoders.push(this.startingGeocoder);
        setGeocoder(this.startingGeocoder, "startingLocation");
    }

    
    createAdditionalGeocoder(){
        let additionalGeocoder = createGeocoder("Additional");
        this.additionalGeocoders.push(additionalGeocoder);  
        this.countAdditionalLocations++;
        setGeocoder(additionalGeocoder, `additionalLocation${this.countAdditionalLocations}`);
        initializeGeocoders([additionalGeocoder]);
    }

    
    #isStartingMarker(){
        if(this.curGeocoder == this.startingGeocoder){
            return true;
        }
        else if(this.curGeocoder != this.startingGeocoder && this.curGeocoder != null){
            return false;
        }
        else if(document.getElementById('startingLocation3').value == ''){
            return true;
        }
        else{
            return false;
        }
    }


    setMarkerWithCorrectType(coordinates, placeName){
        if (this.#isStartingMarker()) {
            this.curStartMarkerBuff = initializeMarkerAndPopup(this.curStartMarkerBuff, coordinates, placeName, "starting");
        }
        else {
            if(this.curAdditionalMarkerBuff["marker"] != null){
                this.curAdditionalMarkerBuff["marker"].remove();
                this.curAdditionalMarkerBuff = {};
            }
            this.curAdditionalMarkerBuff["marker"] = createMarker(coordinates, placeName, "additional");
            this.curAdditionalMarkerBuff["marker"].togglePopup();
            this.curAdditionalMarkerBuff["coordinates"] = coordinates;
            this.curAdditionalMarkerBuff["placeName"] = placeName;
        }
    }


    saveMarker(eventClass){
        if (eventClass.contains('startingPoint')) {
            const marker = createMarker(this.curStartMarkerBuff["coordinates"], this.curStartMarkerBuff["placeName"]);

            if(this.curGeocoder == this.startingGeocoder){
                this.markerList[0] = replaceMarker(this.markerList[0], this.curStartMarkerBuff, marker);
                setDraggable(marker, this.markerList[0]);
            }
            else if(!this.isGenerated) {
                let markerValues = {'marker': marker, 'coordinates' : this.curStartMarkerBuff["coordinates"], placeName: this.curStartMarkerBuff["placeName"]};
                this.markerList.push(markerValues);
                setDraggable(marker, this.markerList[0]);
                this.curStartMarkerBuff["marker"].remove();
                this.createAdditionalGeocoder();
            }
            const startingLocationInputs = this.form.querySelectorAll('.startingLocation');
            startingLocationInputs.forEach(input => {
                input.value = `${this.curStartMarkerBuff["placeName"]}`
            });
            this.curStartMarkerBuff["marker"].togglePopup();
        }

        else if (eventClass.contains('additionalPoint')) {
            const marker = createMarker(this.curAdditionalMarkerBuff["coordinates"], this.curAdditionalMarkerBuff["placeName"]);
            let geocoderOrder = null;
            if(this.markerList.length >= 2 && this.curGeocoder != null && this.additionalGeocoders[this.additionalGeocoders.length - 1] != this.curGeocoder) {
                let curAdditionalMarkerDict = this.getMarkerDictBasedOnGeocoderOrder(this.curGeocoder);
                curAdditionalMarkerDict = replaceMarker(curAdditionalMarkerDict, this.curAdditionalMarkerBuff, marker);
                setDraggable(marker, curAdditionalMarkerDict);
                geocoderOrder = this.additionalGeocoders.indexOf(this.curGeocoder);
            }
            else if(!this.isGenerated) {
                let markerValues = {'marker': marker, 'coordinates' : this.curAdditionalMarkerBuff["coordinates"], placeName: this.curAdditionalMarkerBuff["placeName"]};
                this.markerList.push(markerValues);
                setDraggable(marker, this.markerList[this.markerList.length - 1]);
                this.curAdditionalMarkerBuff["marker"].remove();
                geocoderOrder = this.countAdditionalLocations;
                this.createAdditionalGeocoder();
            }
            const additionalLocationInput = this.form.querySelectorAll(`.additionalLocation${geocoderOrder}`);
            additionalLocationInput.forEach(input => {
                input.value = `${this.curAdditionalMarkerBuff["placeName"]}`
            });
        }
        this.curGeocoder = null;
    }


    updateLocationForm(marker, placeName){
        let locationInput = this.getGeocoderBasedOnMarkerOrder(marker);
        marker.setPopup(new mapboxgl.Popup().setHTML(`<p>${placeName}</p>`))
        locationInput.forEach(input => {
            input.value = `${placeName}`;
        });
    }

    getGeocoderBasedOnMarkerOrder(marker){
        let markers = this.retrieveMarkers();
        let markerOrder = markers.indexOf(marker);
        if(markerOrder < 0){
            return null;
        }
        if(markerOrder == 0){
            return this.form.querySelectorAll(`.startingLocation`);
        }
        if(markerOrder > 0){
            return this.form.querySelectorAll(`.additionalLocation${markerOrder}`);
        }
    }


    getMarkerDictBasedOnGeocoderOrder(geocoder){
        let geocoderOrder = this.additionalGeocoders.indexOf(geocoder);
        if(geocoderOrder < 0){
            return null;
        }
        return this.markerList[geocoderOrder];
    }

    // Change marker map to list to iterate by index. Makes more sense in terms of ordering the markers and the geocoders
    // each index will have a dictionary/map, where there will be the marker, coordinate, and placeName

    getStartAndEnd(){
        let start = this.markerList[0]['coordinates'];
        let end = this.markerList[this.markerList.length - 1]['coordinates'];
        return new Map([
            ['start', start],
            ['end', end]
        ]);
    }


    getAllWaypoints(){
        let waypointsList = [];
        this.markerList.forEach(value => {
            waypointsList.push(value['coordinates']);
        });
        return waypointsList;
    }


    clearForm(){
        this.removeAdditionalGeocoders();
        this.form.reset();
        if(this.curStartMarkerBuff["marker"]){
            this.curStartMarkerBuff["marker"].remove();
            this.curStartMarkerBuff = {};
        }
        if(this.curAdditionalMarkerBuff["marker"]){
            this.curAdditionalMarkerBuff["marker"].remove();
            this.curAdditionalMarkerBuff = {};
        }
        for(let markerDict of this.markerList){
            markerDict['marker'].remove();
        }
        this.markerList = [];
        this.isGenerated = false;
    }


    removeAdditionalGeocoders(){
        for(let i = 1; i <= this.countAdditionalLocations; i++){
            this.form.querySelector(`.additionalLocation${i}`).remove();
        }
        this.additionalGeocoders = [];
        this.countAdditionalLocations = 0;
    }
}
