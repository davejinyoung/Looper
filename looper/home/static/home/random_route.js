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
        return [this.startingGeocoder, this.endingGeocoder]
    }

    createInitialGeocoders(map, token){
        let geocoderSection = this.form.querySelector(".geocoders");
        this.startingGeocoder = new MapboxGeocoder({
            accessToken: token,
            mapboxgl: mapboxgl,
            reverseGeocode: true,
            marker: false,
            placeholder: "Enter Starting Address or Set Point on the Map"
        });
        if(geocoderSection.querySelector('.mapboxgl-ctrl-geocoder .startingLocation') == null){
            geocoderSection.appendChild(this.startingGeocoder.onAdd(map));
            geocoderSection.querySelector('.mapboxgl-ctrl-geocoder').classList.add('startingLocation', 'mb-3');
            geocoderSection.querySelector('.mapboxgl-ctrl-geocoder--input').classList.add('startingLocation');
        }

        this.endingGeocoder = new MapboxGeocoder({
            accessToken: token,
            mapboxgl: mapboxgl,
            reverseGeocode: true,
            marker: false,
            placeholder: "Enter Ending Address or Set Point on the Map"
        });
        if(this.form.querySelector('.mapboxgl-ctrl-geocoder .endingLocation') == null){
            var endingGeocoderElement = this.endingGeocoder.onAdd(map);
            geocoderSection.appendChild(endingGeocoderElement);
            endingGeocoderElement.classList.add('endingLocation', 'mb-3');
            endingGeocoderElement.querySelector('.mapboxgl-ctrl-geocoder--input').classList.add('endingLocation');
        }
    }

    #isStartingMarker(){
        console.log(this.curGeocoder);
        if(this.curGeocoder == this.startingGeocoder){
            return true;
        }
        else if(this.curGeocoder == this.endingGeocoder){
            return false;
        }
        else if(document.getElementById('startingLocation2').value == ''){
            return true;
        }
        else {
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
            if(this.curEndMarkerBuff["marker"] != null){
                this.curEndMarkerBuff["marker"].remove();
                this.curEndMarkerBuff["marker"] = [];
            }
            this.curEndMarkerBuff["marker"] = new mapboxgl.Marker()
                .setLngLat(coordinates)
                .setPopup(new mapboxgl.Popup().setHTML(`<p>${data.features[0].place_name}</p>
                    <button type="button" class="popupButton endingPoint">Set Ending Point</button>`))
                .addTo(map);
            this.curEndMarkerBuff["marker"].togglePopup();
            this.curEndMarkerBuff["coordinates"] = coordinates;
            this.curEndMarkerBuff["placeName"] = data.features[0].place_name;
        }
    }

    saveMarker(event, map){
        if (event.target.classList.contains('startingPoint')) {
            // depreciate
            // this.markerMap.set(this.curStartMarkerBuff["marker"], {"coordinates": this.curStartMarkerBuff["coordinates"], "placeName": this.curStartMarkerBuff["placeName"]});
            
            const marker = new mapboxgl.Marker()
                .setLngLat(this.curStartMarkerBuff["coordinates"])
                .setPopup(new mapboxgl.Popup().setHTML(`<p>${this.curStartMarkerBuff["placeName"]}</p>`))
                .addTo(map);

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
                this.curStartMarkerBuff["marker"].remove();
                let markerValues = {'marker': marker, 'coordinates' : this.curStartMarkerBuff["coordinates"], placeName: this.curStartMarkerBuff["placeName"]};
                this.markerList.push(markerValues);
            }
            const startingLocationInputs = this.form.querySelectorAll('.startingLocation');
            startingLocationInputs.forEach(input => {
                input.value = `${this.curStartMarkerBuff["placeName"]}`
            });
            this.curStartMarkerBuff["marker"].togglePopup();
        }
        else if (event.target.classList.contains('endingPoint')) {
            // this.markerMap.set(this.curEndMarkerBuff["marker"], {"coordinates": this.curEndMarkerBuff["coordinates"], "placeName": this.curEndMarkerBuff["placeName"]});
            const marker = new mapboxgl.Marker()
                .setLngLat(this.curEndMarkerBuff["coordinates"])
                .setPopup(new mapboxgl.Popup().setHTML(`<p>${this.curEndMarkerBuff["placeName"]}</p>`))
                .addTo(map);
            if(this.isGenerated) {
                if(this.curGeocoder == this.endingGeocoder){
                    this.curEndMarkerBuff["marker"].remove();
                    this.markerList[1]['marker'].remove();
                    this.markerList[1]['marker'] = marker;
                    this.markerList[1]['coordinates'] = this.curEndMarkerBuff["coordinates"];
                    this.markerList[1]['placeName'] = this.curEndMarkerBuff["placeName"];
                }
            }
            else {
                this.curEndMarkerBuff["marker"].remove();
                let markerValues = {'marker' : marker, 'coordinates' : this.curEndMarkerBuff["coordinates"], placeName: this.curEndMarkerBuff["placeName"]};
                this.markerList.push(markerValues);
            }
            const endingLocationInputs = this.form.querySelectorAll('.endingLocation');
            endingLocationInputs.forEach(input => {
                input.value = `${this.curEndMarkerBuff["placeName"]}`
            });
            this.curEndMarkerBuff["marker"].togglePopup();
        }
        this.curGeocoder = null;
    }

    updateLocationForm(marker, data){
        marker.setPopup(new mapboxgl.Popup().setHTML(`<p>${data.features[0].place_name}</p>`))
        if(marker == this.markerList[0]['marker']){
            const allForms = document.querySelectorAll('form');
            allForms.forEach(form => {
                const startingLocationInputs = form.querySelectorAll('.startingLocation');
                startingLocationInputs.forEach(input => input.value = `${data.features[0].place_name}`);
            });
        }
        else {
            const randRouteForm = document.getElementById('randRouteForm');
            randRouteForm.querySelector('.mapboxgl-ctrl-geocoder .endingLocation').value = `${data.features[0].place_name}`;
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

    getAllWaypoints(){
        // console.log(this.markerMap);
        console.log(this.markerList);
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