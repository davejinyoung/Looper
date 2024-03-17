export class CustomRoute{
    constructor(){
        this.markerMap = new Map(); // key is the marker, value is a dictionary containing the coordinates and placeName of the marker
        // To think about: Could make a marker class and have the coordinates, placeName, and geocoder as members of the class and keep a list 
        // of marker objects in this class. Lots of refactoring to be done though and may break the logic of some methods.  
        this.curStartMarkerBuff = {}; // current start marker "candidate"
        this.curAdditionalMarkerBuff = {}; // current additional marker "candidate"
        this.form = document.getElementById('customRouteForm'); // form element of custom route
        this.isGenerated = false; // determines if route has been generated or not
        this.startingGeocoder;
        this.additionalGeocoders = []; // might want to change this name to allGeocoders since it includes the starting Geocoder
        this.curGeocoder;
        this.countAdditionalLocations = 0;
        this.uninitializedGeocoder = {"geocoder" : null, "initialized" : false}; 

        this.token;
        this.map;
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

    get allGeocoders(){
        return this.additionalGeocoders;
    }

    createInitialGeocoders(map, token){
        this.token = token;
        this.map = map;

        let geocoderSection = this.form.querySelector(".geocoders");
        this.startingGeocoder = new MapboxGeocoder({
            accessToken: token,
            mapboxgl: mapboxgl,
            reverseGeocode: true,
            marker: false,
            placeholder: "Enter Starting Address or Set Point on the Map"
        });
        this.additionalGeocoders.push(this.startingGeocoder);
        if(geocoderSection.querySelector('.mapboxgl-ctrl-geocoder .startingLocation') == null){
            geocoderSection.appendChild(this.startingGeocoder.onAdd(map));
            geocoderSection.querySelector('.mapboxgl-ctrl-geocoder').classList.add('startingLocation', 'mb-3');
            geocoderSection.querySelector('.mapboxgl-ctrl-geocoder--input').classList.add('startingLocation');
        }
    }

    createAdditionalGeocoder(){
        let additionalGeocoder = new MapboxGeocoder({
            accessToken: this.token,
            mapboxgl: mapboxgl,
            reverseGeocode: true,
            marker: false,
            placeholder: "Enter Additional Address or Set Point on the Map"
        });
        this.additionalGeocoders.push(additionalGeocoder);
        this.countAdditionalLocations++;
        
        let geocoderSection = this.form.querySelector(".geocoders");
        var additionalGeocoderElement = additionalGeocoder.onAdd(this.map);
        geocoderSection.appendChild(additionalGeocoderElement);
        additionalGeocoderElement.classList.add(`additionalLocation${this.countAdditionalLocations}`, 'additionalLocation', 'mb-3');
        additionalGeocoderElement.querySelector('.mapboxgl-ctrl-geocoder--input').classList.add(`additionalLocation${this.countAdditionalLocations}`);

        this.uninitializedGeocoder["geocoder"] = additionalGeocoder;
        this.uninitializedGeocoder["initialized"] = false;
    }

    #isStartingMarker(){
        console.log(this.curGeocoder);

        if(this.curGeocoder == this.startingGeocoder){
            return true;
        }
        // else if(this.curGeocoder == this.endingGeocoder){
        //     return false;
        // }
        else if(document.getElementById('startingLocation3').value == ''){
            return true;
        }
        else {
            return false;
        }

        // if (document.getElementById('startingLocation3').value != '' ){
        //     return false;
        // }
        // return true;
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
                    <button type="button" class="popupButton startingPoint">Set Starting Point</button>`))
                .addTo(map);
            this.curStartMarkerBuff["marker"].togglePopup();
            this.curStartMarkerBuff["coordinates"] = coordinates;
            this.curStartMarkerBuff["placeName"] = data.features[0].place_name;
        }
        else {
            if(this.curAdditionalMarkerBuff["marker"] != null){
                this.curAdditionalMarkerBuff["marker"].remove();
                this.curAdditionalMarkerBuff = {};
            }
            this.curAdditionalMarkerBuff["marker"] = new mapboxgl.Marker()
                .setLngLat(coordinates)
                .setPopup(new mapboxgl.Popup().setHTML(`<p>${data.features[0].place_name}</p>
                    <button type="button" class="popupButton additionalPoint">Set Additional Point</button>`))
                .addTo(map);
            this.curAdditionalMarkerBuff["marker"].togglePopup();
            this.curAdditionalMarkerBuff["coordinates"] = coordinates;
            this.curAdditionalMarkerBuff["placeName"] = data.features[0].place_name;
        }
    }

    saveMarker(event, map){
        if (event.target.classList.contains('startingPoint')) {
            this.markerMap.set(this.curStartMarkerBuff["marker"], {"coordinates": this.curStartMarkerBuff["coordinates"], "placeName": this.curStartMarkerBuff["placeName"]});
            const startingLocationInputs = this.form.querySelectorAll('.startingLocation');
            startingLocationInputs.forEach(input => {
                input.value = `${this.markerMap.get(this.curStartMarkerBuff["marker"])["placeName"]}`;
            });
            this.curStartMarkerBuff["marker"].togglePopup();
        }
        else if (event.target.classList.contains('additionalPoint')) {
            const marker = new mapboxgl.Marker()
                .setLngLat(this.curAdditionalMarkerBuff["coordinates"])
                .addTo(map);
            this.markerMap.set(marker, {"coordinates": this.curAdditionalMarkerBuff["coordinates"], "placeName": this.curAdditionalMarkerBuff["placeName"]});
            this.curAdditionalMarkerBuff["marker"].remove();

            const additionalLocationInputs = this.form.querySelectorAll(`.additionalLocation${this.countAdditionalLocations}`);
            additionalLocationInputs.forEach(input => {
                input.value = `${this.curAdditionalMarkerBuff["placeName"]}`;
            });
        }
        this.curGeocoder = null;
        this.createAdditionalGeocoder();
    }

    updateLocationForm(marker, data){
        let locationInput = this.getGeocoderBasedOnMarkerOrder(marker);
        locationInput.forEach(input => {
            input.value = `${data.features[0].place_name}`;
        });
    }

    getGeocoderBasedOnMarkerOrder(marker){
        let markerList = Array.from(this.markerMap.keys());
        let markerOrder = markerList.indexOf(marker);
        if(markerOrder == 0){
            return this.form.querySelectorAll(`.startingLocation`);
        }
        return this.form.querySelectorAll(`.additionalLocation${markerOrder}`);
    }

    getMarkerBasedOnGeocoderOrder(marker){
        let markerList = Array.from(this.markerMap.keys());
        let markerOrder = markerList.indexOf(marker);
        if(markerOrder == 0){
            return this.form.querySelectorAll(`.startingLocation`);
        }
        return this.form.querySelectorAll(`.additionalLocation${markerOrder}`);
    }

    // Change marker map to list to iterate by index. Makes more sense in terms of ordering the markers and the geocoders
    // each index will have a dictionary/map, where there will be the marker, coordinate, and placeName

    getStartAndEnd(){
        let markerList = Array.from(this.markerMap.keys());
        let endMarker = markerList[markerList.length - 1];
        let start = this.markerMap.get(this.curStartMarkerBuff["marker"])["coordinates"];
        let end = this.markerMap.get(endMarker)["coordinates"];
        return new Map([
            ['start', start],
            ['end', end]
        ]);
    }

    getAllWaypoints(){
        let waypointsList = [];
        this.markerMap.forEach(value => {
            console.log(value);
            waypointsList.push(value["coordinates"]);
        })
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
        for(let marker of this.markerMap.keys()){
            marker.remove();
        }
        this.markerMap.clear();
        this.isGenerated = false;
    }

    removeAdditionalGeocoders(){
        let allAdditionalGeocoderElements = this.form.querySelectorAll('.additionalLocation');
        allAdditionalGeocoderElements.forEach(element => {
            element.remove();
        });
        this.additionalGeocoders = [];
        this.countAdditionalLocations = 0;
    }
}