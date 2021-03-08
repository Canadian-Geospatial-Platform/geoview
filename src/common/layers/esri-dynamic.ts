import { Map } from 'leaflet';

import { dynamicMapLayer, mapService } from 'esri-leaflet';

import { LayerData, LayerConfig } from './layer';
import { getMapServerUrl } from '../utilities';

/**
 * a class to add esri dynamic layer
 *
 * @export
 * @class EsriDynamic
 */
export class EsriDynamic {
    /**
     * Add a ESRI dynamic layer to the map.
     *
     * @param {Map} map the Leaflet map
     * @param {LayerConfig} layer the layer configuration
     * @param {string} layerID the layer id
     * @param {Array<LayerData>} layers a reference to the layers array
     */
    add(map: Map, layer: LayerConfig, layerID: string, layers: Array<LayerData>): void {
        const feat = dynamicMapLayer({
            url: layer.url,
            layers: layer.entries.split(',').map((item: string) => {
                return parseInt(item, 10);
            }),
            attribution: '',
        });

        // add layer to map
        feat.addTo(map);
        layers.push({
            id: layerID,
            type: layer.type,
            layer: Object.defineProperties(feat, {
                mapService: {
                    value: mapService({
                        url: getMapServerUrl(layer.url),
                    }),
                },
            }),
        });
    }
}
