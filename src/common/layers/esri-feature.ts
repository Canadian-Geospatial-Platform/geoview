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
     * @param {string} layerID the layer id
     * @param {Array<LayerData>} layers a reference to the layers array
     */
    add(map: Map, layer: LayerConfig, layerID: string, layers: Array<LayerData>): void {
        const feat = featureLayer({
            url: layer.url,
        });

        // add layer to map
        feat.addTo(map);
        layers.push({
            id: layerID,
            type: layer.type,
            layer: feat,
        });
    }
}
