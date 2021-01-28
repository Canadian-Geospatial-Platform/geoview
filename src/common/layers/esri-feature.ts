import { Map } from 'leaflet';

import { featureLayer } from 'esri-leaflet';

import { LayerData, LayerConfig } from './layer';

/**
 * a class to add esri feature layer
 *
 * @export
 * @class EsriFeature
 */
export class EsriFeature {
    /**
     * Add a ESRI feature layer to the map.
     *
     * @param {Map} map the Leaflet map
     * @param {LayerConfig} layer the layer configuration
     * @param {Array<LayerData>} layers a reference to the layers array
     */
    add(map: Map, layer: LayerConfig, layers: Array<LayerData>): void {
        const feat = featureLayer({
            url: layer.url,
        });

        feat.addTo(map);

        layers.push({
            // TODO generate an ID with better format
            id: new Date().getTime().toString(),
            type: layer.type,
            layer: feat,
        });
    }
}
