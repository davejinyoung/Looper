export class CustomRoute{
    constructor(){
        this.markerMap = new Map();
        this.curStartMarkerBuff = {}; // current start marker "candidate"
        this.curAdditionalMarkerBuff = {}; // current additional marker "candidate"
        this.form = document.getElementById('customRouteForm'); // form element of custom route
        this.isGenerated = false; // determines if route has been generated or not
        this.startingGeocoder;
        this.additionalGeocoders = [];
        this.curGeocoder;
        this.countAdditionalLocations = 0;

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

    createSearchBox(map, token){
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

    createAdditionalSearchBoxes(){
        let additionalGeocoder = new MapboxGeocoder({
            accessToken: this.token,
            mapboxgl: mapboxgl,
            reverseGeocode: true,
            marker: false,
            placeholder: "Enter Additional Address or Set Point on the Map"
        });
        this.additionalGeocoders.push(additionalGeocoder);
        this.countAdditionalLocations++;

        if(this.form.querySelector('.mapboxgl-ctrl-geocoder .additionalLocation') == null){
            let geocoderSection = this.form.querySelector(".geocoders");
            var additionalGeocoderElement = additionalGeocoder.onAdd(this.map);
            geocoderSection.appendChild(additionalGeocoderElement);
            additionalGeocoderElement.classList.add(`additionalLocation${this.countAdditionalLocations}`, 'additionalLocation', 'mb-3');
            additionalGeocoderElement.querySelector('.mapboxgl-ctrl-geocoder--input').classList.add(`additionalLocation${this.countAdditionalLocations}`);
        }
    }

    #isStartingMarker(){
        if (document.getElementById('startingLocation3').value != ''){
            return false;
        }
        return true;
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
        this.createAdditionalSearchBoxes();
    }

    updateLocationForm(marker, data){
        if(this.markerMap.get(marker) == this.markerMap.get(this.curStartMarkerBuff["marker"])){
            const allForms = document.querySelectorAll('form');
            allForms.forEach(form => {
                const startingLocationInputs = form.querySelectorAll('.startingLocation');
                startingLocationInputs.forEach(input => input.value = `${data.features[0].place_name}`);
            });
        }
        else {
            const randRouteForm = document.getElementById('custRouteForm');
            // TODO: create forms for additional locations
//            randRouteForm.endingLocation.value = `${data.features[0].place_name}`
        }
    }

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
        this.markerMap.forEach(function(value) {
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