import L, { Map } from 'leaflet';

import { LayerConfig, LayerData } from './layer';

/**
 * Class used to add geojson layer to the map
 *
 * @export
 * @class GeoJSON
 */
export class GeoJSON {
    /**
     * Load geojson from a file and then send it as a string using the callback
     * @param {string} url the file url
     * @param {Function} callback callback function after the geojson is loaded
     */
    load(url: string, callback: (data: string) => void): void {
        const jsonObj = new XMLHttpRequest();
        jsonObj.overrideMimeType('application/json');
        jsonObj.open('GET', url, true);
        jsonObj.onreadystatechange = () => {
            if (jsonObj.readyState === 4 && jsonObj.status === 200) {
                if (callback) callback(jsonObj.responseText);
            }
        };
        jsonObj.send(null);
    }

    /**
     * Add a geojson to the map
     *
     * @param {Map} map a reference to the leaflet map
     * @param {string} layer the layer configuration
     * @param {Array<LayerData>} layers a reference to the layers array
     */
    add(map: Map, layer: LayerConfig, layers: Array<LayerData>): string {
        const layerid = new Date().getTime().toString();
        this.load(layer.url, (data) => {
            // parse the json string and convert it to a json object
            const featureCollection = JSON.parse(data);

            // add the geojson to the map
            const geojson = L.geoJSON(featureCollection, {
                // TODO classes will be created to style the elements, it may get the info from theming
                // add styling
                style: (feature) => {
                    if (feature?.geometry.type === 'Polygon') {
                        switch (feature.properties.number) {
                            case 'One':
                                return { color: '#ff0000' };
                            case 'Two':
                                return { color: '#0000ff' };
                            default:
                                return { color: '#696969' };
                        }
                    } else if (feature?.geometry.type === 'LineString') {
                        return {
                            color: '#000000',
                            weight: 5,
                            opacity: 0.65,
                        };
                    }

                    return {};
                },
            });

            // add layer to map
            geojson.addTo(map);
            layers.push({
                // TODO generate an ID with better format
                id: layerid,
                type: layer.type,
                layer: geojson,
            });
        });
        return layerid;
    }
}
