import { Map } from 'leaflet';

import { dynamicMapLayer } from 'esri-leaflet';

import { LayerData, LayerConfig } from './layer';

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
     * @param {Array<LayerData>} layers a reference to the layers array
     */
    add(map: Map, layer: LayerConfig, layers: Array<LayerData>): string {
        const feat = dynamicMapLayer({
            url: layer.url,
            layers: layer.entries.split(',').map((item: string) => {
                return parseInt(item, 10);
            }),
            attribution: '',
        });
        const layerid = new Date().getTime().toString();
        feat.addTo(map);

        layers.push({
            // TODO generate an ID with better format
            id: new Date().getTime().toString(),
            type: layer.type,
            layer: feat,
        });
        return layerid;
    }
}
