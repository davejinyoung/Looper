import { calculateOptimizedRoute, setDraggable, initializeMarkerAndPopup, createMarker, replaceMarker, createPopup, addPopupCloseButtonListener} from './mapbox.js';

export class CustomRoute {
    
    constructor(){
        this.markerList = []; // Replacement of markerMap 
        this.curStartMarkerBuff = {}; // current start marker "candidate"
        this.curAdditionalMarkerBuff = {}; // current additional marker "candidate"
        this.form = document.getElementById('customRouteForm'); // form element of custom route
        this.isGenerated = false; // determines if route has been generated or not
        this.countAdditionalLocations = 0;
    }


    get isCurrentForm(){
        return Object.values(this.form.classList).indexOf('d-none') == -1;
    }


    get allMarkers(){
        return this.retrieveMarkers()
    }

    // TODO: fix or obsolete this unreachable function
    validateFormSubmission(){
        if (this.markerList.length == 0) {
            alert('Please enter a valid starting location');
            return false;
        }
        if (this.markerList.length == 1) {
            alert('Please enter at least one additional location');
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

    
    #isStartingMarker(){
        return this.markerList.length == 0;
    }


    setMarkerWithCorrectType(coordinates, placeName) {
        if (this.#isStartingMarker()) {
            this.curStartMarkerBuff = initializeMarkerAndPopup(this.curStartMarkerBuff, coordinates, placeName, "starting");
            addPopupCloseButtonListener(this.curStartMarkerBuff);
        }
        else {
            this.curAdditionalMarkerBuff = initializeMarkerAndPopup(this.curAdditionalMarkerBuff, coordinates, placeName, "additional");
            addPopupCloseButtonListener(this.curAdditionalMarkerBuff);
        }
    }


    saveMarker(eventClass){
        if (eventClass.contains('startingPoint')) {
            if(!this.isGenerated) {
                const marker = createMarker(this.curStartMarkerBuff["coordinates"], this.curStartMarkerBuff["placeName"]);
                let markerValues = {'marker': marker, 'coordinates' : this.curStartMarkerBuff["coordinates"], placeName: this.curStartMarkerBuff["placeName"]};
                this.markerList.push(markerValues);
                setDraggable(marker, this.markerList[0]);
                this.curStartMarkerBuff["marker"].remove();
            }
            this.curStartMarkerBuff["marker"].togglePopup();
        }

        else if (eventClass.contains('additionalPoint')) {
            let popup = createPopup(this.curStartMarkerBuff["placeName"], "returnToStart");
            this.markerList[0]["marker"].setPopup(popup)
            const marker = createMarker(this.curAdditionalMarkerBuff["coordinates"], this.curAdditionalMarkerBuff["placeName"]);
            let markerValues = {'marker': marker, 'coordinates' : this.curAdditionalMarkerBuff["coordinates"], placeName: this.curAdditionalMarkerBuff["placeName"]};
            this.markerList.push(markerValues);
            setDraggable(marker, this.markerList[this.markerList.length - 1]);
            this.curAdditionalMarkerBuff["marker"].remove();
            calculateOptimizedRoute(false);
        }
    }


    updateLocationForm(marker, placeName){
        const isStarting = marker == this.markerList[0]['marker'];
        const isLastMarkerEqualToStart = this.markerList[this.markerList.length - 1]['marker'] == this.markerList[0]['marker'];
        const markerType = isStarting && !isLastMarkerEqualToStart ? "returnToStart" : null;
        let popup = createPopup(placeName, markerType);
        marker.setPopup(popup)
    }


    getStartAndEnd(){
        let start = this.markerList[0]['coordinates'];
        let end = this.markerList[this.markerList.length - 1]['coordinates'];
        return new Map([
            ['start', start],
            ['end', end]
        ]);
    }


    getAllWaypoints(generateButtonClicked){
        let waypointsList = [];
        this.markerList.forEach(value => {
            waypointsList.push(value['coordinates']);
        });
        return waypointsList;
    }


    clearForm(){
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
}
