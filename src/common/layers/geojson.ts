import L, { Layer } from 'leaflet';

import { LayerConfig } from './layer';
import { getXMLHttpRequest } from '../utilities';

/**
 * Class used to add geojson layer to the map
 *
 * @export
 * @class GeoJSON
 */
export class GeoJSON {
    /**
     * Add a GeoJSON layer to the map.
     *
     * @param {LayerConfig} layer the layer configuration
     * @return {Promise<Layer | string>} layers to add to the map
     */
    add(layer: LayerConfig): Promise<Layer | string> {
        const data = getXMLHttpRequest(layer.url);

        const geo = new Promise<Layer | string>((resolve) => {
            data.then((value: string) => {
                if (value !== '{}') {
                    // parse the json string and convert it to a json object
                    const featureCollection = JSON.parse(value);

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

                    resolve(geojson);
                } else {
                    resolve(value);
                }
            });
        });

        return new Promise((resolve) => resolve(geo));
    }
}
