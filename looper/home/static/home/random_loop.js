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


    getDistance() {
        const distanceElement = document.getElementById('distance');
        const distanceValue = distanceElement.value;
        return Number(distanceValue);
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


    getRandomWaypoints(startingCoords){
        const earthRadius = 6378.137; // in km

        console.log("starting coordinates are: " + startingCoords);

        let distance = this.getDistance();
        console.log("distance is: " + distance);

        let numRandomWaypoints = this.randomIntFromInterval(2, 5);
        console.log("number of random waypoints is: " + numRandomWaypoints);
        
        let legDistances = this.randomizeEachLegValues(distance, numRandomWaypoints);
        console.log("leg distances are: " + legDistances);

        let legAngles = this.randomizeEachLegValues(360, numRandomWaypoints);
        console.log("leg angles are: " + legAngles);

        let inverseHaversine = this.inverseHaversine(startingCoords, legDistances[0]/earthRadius, this.toRadians(legAngles[0]));
        console.log("inverse haversine is: " + inverseHaversine['lng'] + ", " + inverseHaversine['lat']);

        let waypoints = [];
        let basePoint = {'coords': startingCoords, 'angle': 0};
        for(let i = 0; i < numRandomWaypoints; i++) {
            let randWaypoint = this.inverseHaversine(basePoint['coords'], legDistances[i]/earthRadius, this.toRadians(legAngles[i] + basePoint['angle']));
            waypoints.push(randWaypoint);
            basePoint['coords'] = [randWaypoint['lng'], randWaypoint['lat']];
            basePoint['angle'] = legAngles[i];
        }

        return waypoints;
    }


    getAllWaypoints(){
        let allWaypoints = [];
        let startingCoords = this.curStartMarkerBuff['coordinates'];
        allWaypoints.push(startingCoords);
        this.getRandomWaypoints(startingCoords).forEach(waypoint => {
            console.log(waypoint);
            allWaypoints.push([waypoint['lng'], waypoint['lat']])
            createMarker([waypoint['lng'], waypoint['lat']]);
        });
        allWaypoints.push(startingCoords);
        console.log(allWaypoints);
        return allWaypoints;
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