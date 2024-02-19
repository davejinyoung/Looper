export class Route {
  constructor() {
    this.curStartMarker;
    this.curEndMarker;
    this.curAdditionalMarker;
    this.startingLocation = new Map();
    this.endingLocation = new Map();
    this.additionalLocation = new Map();
    this.map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-123.12, 49.28],
        zoom: 10,
        projection: 'mercator'
    });
  }
}