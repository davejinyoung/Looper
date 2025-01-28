import { initializeMarkerAndPopup, createMarker, removeExistingRouteLayer, replaceMarker, setDraggable, getPlaceName, createPopup, addPopupCloseButtonListener } from './mapbox.js';

export class RandomLoop{

    constructor(){
        this.curStartMarkerBuff = {}; // current start marker 
        this.candidateStartMarkerBuff = {}; // current start marker candidate
        this.markerList = [];
        this.customRouteObj = null;
        this.distance; // distance of route
        this.form = document.getElementById('randLoopForm'); // form element of random loop
        this.isGenerated = false; // determines if route has been generated or not
    }


    get isCurrentForm(){
        return Object.values(this.form.classList).indexOf('d-none') == -1;
    }


    get allMarkers(){
        return retrieveMarkers;
    }


    validateFormSubmission(){
        if(this.markerList.length == 0){
            alert('Please enter a valid starting location');
            return false;
        }
        if(distance.value == '' || distance.value <= 0){
            alert('Please enter a valid distance');
            return false;
        }
        return document.getElementById('distance').value > 0;
    }


    retrieveMarkers(){
        let markers = [];
        if(this.markerList != null){
            this.markerList.forEach(markerElement => {
                markers.push(markerElement['marker']);
            });
        }
        return markers;
    }


    setMarkerWithCorrectType(coordinates, placeName) {
        const markerBufferKey = this.isGenerated ? 'candidateStartMarkerBuff' : 'curStartMarkerBuff';
        
        this[markerBufferKey] = initializeMarkerAndPopup(
            this[markerBufferKey], 
            coordinates, 
            placeName, 
            "starting"
        );
        
        addPopupCloseButtonListener(this[markerBufferKey]);
    }


    saveMarker(eventClass){
        if (eventClass.contains('startingPoint')) {
            const startingLocationInputs = this.form.querySelectorAll('.startingLocation');
            if (!this.isGenerated){
                startingLocationInputs.forEach(input => {
                    input.value = `${this.curStartMarkerBuff['placeName']}`
                });
                let popup = createPopup(this.curStartMarkerBuff["placeName"]);
                this.curStartMarkerBuff["marker"].setPopup(popup);
                setDraggable(this.curStartMarkerBuff["marker"], this.curStartMarkerBuff);
                this.clearMarkers();
                this.markerList.push(this.curStartMarkerBuff);
            } 
            else {
                const marker = createMarker(this.candidateStartMarkerBuff["coordinates"], this.candidateStartMarkerBuff["placeName"]);
                this.curStartMarkerBuff = replaceMarker(this.curStartMarkerBuff, this.candidateStartMarkerBuff, marker);
                startingLocationInputs.forEach(input => {
                    input.value = `${this.curStartMarkerBuff['placeName']}`
                });
                this.clearMarkers();
                this.markerList[0] = this.curStartMarkerBuff;
                removeExistingRouteLayer();
                this.isGenerated = false;
            }
        }
    }


    getStartAndEnd(){
        return new Map([
            ['start', this.curStartMarkerBuff['coordinates']]
        ]);
    }

    updateLocationForm(marker, placeName){
        let popup = createPopup(placeName);
        marker.setPopup(popup)
        if(marker == this.curStartMarkerBuff['marker']){
            const allForms = document.querySelectorAll('form');
            allForms.forEach(form => {
                const startingLocationInputs = form.querySelectorAll('.startingLocation');
                startingLocationInputs.forEach(input => input.value = `${placeName}`);
            });
        }
    }


    getDistance() {
        return Number(document.getElementById('distance').value);
    }

    getDistanceAccuracy() {
        return Number(document.getElementById('distanceAccuracy').value);
    }

    getDistanceMargin() {
        let distance = this.getDistance();
        let distanceAccuracy = this.getDistanceAccuracy();
        return {'min': distance * distanceAccuracy * 1000, 'max': distance * (2-distanceAccuracy) * 1000}; // in meters
    }


    randomIntFromInterval(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min)
    }


    randomizeEachLegValues(totalDistanceOrAngle, numRandomWaypoints){
        let distancesOrAngles = [];
        let totalProportionalDistanceOrAngle = 0;
        for(let i = 0; i <= numRandomWaypoints; i++) {
            let randomProportionalDistanceOrAngle = Math.random();
            totalProportionalDistanceOrAngle += randomProportionalDistanceOrAngle;
            distancesOrAngles.push(randomProportionalDistanceOrAngle);
        }
        let ratio = totalDistanceOrAngle / totalProportionalDistanceOrAngle;
        for(let i = 0; i <= numRandomWaypoints; i++) {
            distancesOrAngles[i] = Math.round(distancesOrAngles[i] * ratio * 100) / 100;
        }
        return distancesOrAngles;
    }


    toRadians(degrees) {
        return degrees * Math.PI / 180;
    }


    toDegrees(radians) {
        return radians * 180 / Math.PI;
    }


    haversine(lastCoords, startingCoords) {
        const earthRadius = 6378.137;
        let lat1 = this.toRadians(lastCoords[1]);
        let lng1 = this.toRadians(lastCoords[0]);
        let lat2 = this.toRadians(startingCoords[1]);
        let lng2 = this.toRadians(startingCoords[0]);
        const lat = lat2 - lat1;
        const lng = lng2 - lng1;
        const d = (Math.sin(lat * 0.5) ** 2) +
                  (Math.cos(lat1) * Math.cos(lat2) * (Math.sin(lng * 0.5) ** 2));
    
        return earthRadius * 2 * Math.asin(Math.sqrt(d));
    }


    inverseHaversine(baseCoords, distance, bearing) {
        let lat = this.toRadians(baseCoords[1]);
        let lng = this.toRadians(baseCoords[0]);
        let cosD = Math.cos(distance);
        let sinD = Math.sin(distance);
        let cosLat = Math.cos(lat);
        let sinLat = Math.sin(lat);
        let sinDCosLat = sinD * cosLat;
        let returnLat = Math.asin(cosD * sinLat + sinDCosLat * Math.cos(bearing));
        let returnLng = lng + Math.atan2(Math.sin(bearing) * sinDCosLat, cosD - sinLat * Math.sin(returnLat));
        return { 'lat': this.toDegrees(returnLat), 'lng': this.toDegrees(returnLng) };
    }


    createCoordinatesList(legDistances, legAngles, numRandomWaypoints, startingCoords, adjusted=false){
        const earthRadius = 6378.137; // in km
        let waypoints = [];
        let basePoint = {'coordinates': startingCoords, 'angle': 0};
        for(let i = 0; i < numRandomWaypoints; i++) {
            let angle = legAngles[i] + basePoint['angle'];
            if(document.getElementById('antiClockwise').checked){
                angle = 360 - angle;
            }
            let randWaypoint = this.inverseHaversine(basePoint['coordinates'], legDistances[i]/earthRadius, this.toRadians(angle));
            let newCoords = [randWaypoint['lng'], randWaypoint['lat']];
            let newMarker = createMarker(newCoords, null, null, false);
            let markerDict = {'marker': newMarker, 'coordinates': newCoords, 'placeName': ''};

            getPlaceName(newCoords)
                .then(placeName => {
                    markerDict['placeName'] = placeName;
                    this.updateLocationForm(newMarker, placeName);
                    let popup = createPopup(placeName);
                    newMarker.setPopup(popup);
                })
                .catch(error => {
                    console.error('Error:', error);
                });

            setDraggable(newMarker, markerDict);
            waypoints.push(markerDict);
            basePoint['coordinates'] = newCoords;
            basePoint['angle'] += legAngles[i];
        }
        let realDistance = this.haversine(basePoint['coordinates'], startingCoords);
        console.log("last leg distance was predicted to be: " + legDistances[legDistances.length-1] + " but the real distance was: " + realDistance);
        let margin = legDistances.slice(-1) - realDistance;
        if(adjusted){
            return waypoints;
        }

        legDistances[legDistances.length-1] = realDistance;
        let equalDistancePartition = margin / legDistances.length;
        for(let i = 0; i < legDistances.length; i++) {
            legDistances[i] += equalDistancePartition;
        }
        return this.createCoordinatesList(legDistances, legAngles, numRandomWaypoints, startingCoords, true);
    }


    getRandomWaypoints(startingCoords){
        console.log("starting coordinates are: " + startingCoords);

        let distanceAdjustmentRatio = 0.80; // make this into a calculation based on averages and trends

        let distance = this.getDistance() * distanceAdjustmentRatio;

        let numRandomWaypoints = this.randomIntFromInterval(3, 5);
        console.log("number of random waypoints is: " + numRandomWaypoints);
        
        let legDistances = this.randomizeEachLegValues(distance, numRandomWaypoints);
        console.log("leg distances are: " + legDistances);

        let legAngles = this.randomizeEachLegValues(360, numRandomWaypoints);
        console.log("leg angles are: " + legAngles);

        return this.createCoordinatesList(legDistances, legAngles, numRandomWaypoints, startingCoords);
    }


    getAllWaypoints(generateButtonClicked){
        if(generateButtonClicked){
            this.clearMarkers();
            this.curStartMarkerBuff['marker'] = createMarker(this.curStartMarkerBuff['coordinates'], this.curStartMarkerBuff['placeName']);
            setDraggable(this.curStartMarkerBuff['marker'], this.curStartMarkerBuff);
            this.markerList.push(this.curStartMarkerBuff);
            this.markerList = this.markerList.concat(this.getRandomWaypoints(this.curStartMarkerBuff['coordinates']));
        }
        let waypointsList = [];
        this.markerList.forEach(value => {
            waypointsList.push(value['coordinates']);
        });
        waypointsList.push(this.curStartMarkerBuff['coordinates']);
        return waypointsList;
    }


    clearMarkers(){
        for(let marker of this.retrieveMarkers()){
            marker.remove();
        }
        this.markerList = [];
    }


    clearForm(){
        this.form.reset();
        if(this.curStartMarkerBuff['marker']){
            this.curStartMarkerBuff['marker'].remove();
            this.curStartMarkerBuff = {};
        }
        if(this.candidateStartMarkerBuff['marker']){
            this.candidateStartMarkerBuff['marker'].remove();
            this.candidateStartMarkerBuff = {};
        }
        this.isGenerated = false;
        this.clearMarkers();
    }
}