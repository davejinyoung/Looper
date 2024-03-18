export class CustomRoute{
    constructor(){
        // depreciate 
        //this.markerMap = new Map(); // key is the marker, value is a dictionary containing the coordinates and placeName of the marker
        // To think about: Could make a marker class and have the coordinates, placeName, and geocoder as members of the class and keep a list 
        // of marker objects in this class. Lots of refactoring to be done though and may break the logic of some methods.  

        this.markerList = []; // Replacement of markerMap 
        
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
        // depreciate
        // return Array.from(this.markerMap.keys());
        return this.retrieveMarkers()
    }

    retrieveMarkers(){
        let markers = [];
        this.markerList.forEach(markerElement => {
            markers.push(markerElement['marker']);
        });
        console.log(markers);
        return markers;
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

    // TODO: clean this up
    saveMarker(event, map){
        if (event.target.classList.contains('startingPoint')) {
            const marker = new mapboxgl.Marker()
                .setLngLat(this.curStartMarkerBuff["coordinates"])
                .setPopup(new mapboxgl.Popup().setHTML(`<p>${this.curStartMarkerBuff["placeName"]}</p>`))
                .addTo(map);
            // depreciate
            // this.markerMap.set(this.curStartMarkerBuff["marker"], {"coordinates": this.curStartMarkerBuff["coordinates"], "placeName": this.curStartMarkerBuff["placeName"]});
            if(this.isGenerated) {
                if(this.curGeocoder == this.startingGeocoder){
                    this.curStartMarkerBuff["marker"].remove();
                    this.markerList[0]['marker'].remove();
                    this.markerList[0]['marker'] = marker;
                    this.markerList[0]['coordinates'] = this.curStartMarkerBuff["coordinates"];
                    this.markerList[0]['placeName'] = this.curStartMarkerBuff["placeName"];
                }
            }
            else {
                let markerValues = {'marker': marker, 'coordinates' : this.curStartMarkerBuff["coordinates"], placeName: this.curStartMarkerBuff["placeName"]};
                this.markerList.push(markerValues);

                this.curStartMarkerBuff["marker"].remove();
                this.createAdditionalGeocoder();
            }
            const startingLocationInputs = this.form.querySelectorAll('.startingLocation');
            startingLocationInputs.forEach(input => {
                input.value = `${this.curStartMarkerBuff["placeName"]}`
            });
            this.curStartMarkerBuff["marker"].togglePopup();
        }
        else if (event.target.classList.contains('additionalPoint')) {
            const marker = new mapboxgl.Marker()
                    .setLngLat(this.curAdditionalMarkerBuff["coordinates"])
                    .setPopup(new mapboxgl.Popup().setHTML(`<p>${this.curAdditionalMarkerBuff["placeName"]}</p>`))
                    .addTo(map);
            if(this.isGenerated && this.additionalGeocoders[this.additionalGeocoders.length - 1] != this.curGeocoder) {
                let curAdditionalMarkerDict = this.getMarkerDictBasedOnGeocoderOrder(this.curGeocoder);
                if(curAdditionalMarkerDict != null){
                    this.curAdditionalMarkerBuff["marker"].remove();
                    curAdditionalMarkerDict['marker'].remove();
                    curAdditionalMarkerDict['marker'] = marker;
                    curAdditionalMarkerDict['coordinates'] = this.curAdditionalMarkerBuff["coordinates"];
                    curAdditionalMarkerDict['placeName'] = this.curAdditionalMarkerBuff["placeName"];

                    const additionalLocationInput = this.form.querySelectorAll(`.additionalLocation${this.additionalGeocoders.indexOf(this.curGeocoder)}`);
                    additionalLocationInput.forEach(input => {
                        input.value = `${this.curAdditionalMarkerBuff["placeName"]}`;
                    });
                }
            }
            else {
                // depreciate
                // this.markerMap.set(marker, {"coordinates": this.curAdditionalMarkerBuff["coordinates"], "placeName": this.curAdditionalMarkerBuff["placeName"]});
                let markerValues = {'marker': marker, 'coordinates' : this.curAdditionalMarkerBuff["coordinates"], placeName: this.curAdditionalMarkerBuff["placeName"]};
                this.markerList.push(markerValues);

                this.curAdditionalMarkerBuff["marker"].remove();
                const additionalLocationInput = this.form.querySelectorAll(`.additionalLocation${this.countAdditionalLocations}`);
                additionalLocationInput.forEach(input => {
                    input.value = `${this.curAdditionalMarkerBuff["placeName"]}`;
                });
                this.createAdditionalGeocoder();
            }            
        }
        this.curGeocoder = null;
    }

    updateLocationForm(marker, data){
        let locationInput = this.getGeocoderBasedOnMarkerOrder(marker);
        marker.setPopup(new mapboxgl.Popup().setHTML(`<p>${data.features[0].place_name}</p>`))
        locationInput.forEach(input => {
            input.value = `${data.features[0].place_name}`;
        });
    }

    getGeocoderBasedOnMarkerOrder(marker){
        // depreciate
        // let markerList = Array.from(this.markerMap.keys());

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
        // depreciate
        // let markerList = Array.from(this.markerMap.keys());

        // TODO: work on logic ( it's currently the same as getGeocoderBasedOnMarkerOrder() )

        let geocoderOrder = this.additionalGeocoders.indexOf(geocoder);

        if(geocoderOrder < 0){
            return null;
        }
        return this.markerList[geocoderOrder];
    }

    // Change marker map to list to iterate by index. Makes more sense in terms of ordering the markers and the geocoders
    // each index will have a dictionary/map, where there will be the marker, coordinate, and placeName

    getStartAndEnd(){
        // depreciate 
        // let markerList = Array.from(this.markerMap.keys());
        let markers = this.retrieveMarkers();
        let start = this.markerList[0]['coordinates'];
        let end = this.markerList[this.markerList.length - 1]['coordinates'];
        return new Map([
            ['start', start],
            ['end', end]
        ]);
    }

    getAllWaypoints(){
        let waypointsList = [];
        // depreciate
        // this.markerMap.forEach(value => {
        //     console.log(value);
        //     waypointsList.push(value["coordinates"]);
        // })
        this.markerList.forEach(value => {
            waypointsList.push(value['coordinates']);
        });
        console.log(waypointsList);
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
        let allAdditionalGeocoderElements = this.form.querySelectorAll('.additionalLocation');
        allAdditionalGeocoderElements.forEach(element => {
            element.remove();
        });
        this.additionalGeocoders = [];
        this.countAdditionalLocations = 0;
    }
}