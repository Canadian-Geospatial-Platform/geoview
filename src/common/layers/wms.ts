import L, { Map } from 'leaflet';

import { LayerConfig, LayerData } from './layer';

// TODO: this needs cleaning some layer type like WMS are part of react-leaflet and can be use as a component

/**
 * a class to add wms layer
 *
 * @export
 * @class WMS
 */
export class WMS {
    // TODO: try to avoid getCapabilities for WMS. Use Web Presence metadata return info to store, legend image link, layer name, and other needed properties.
    // in fact, to this for all the layer type
    /**
     * Add a WMS layer to the map.
     *
     * @param {object} map the Leaflet map
     * @param {LayerConfig} layer the layer configuration
     * @param {Array<LayerData>} layers a reference to the layers array
     */
    add(map: Map, layer: LayerConfig, layers: Array<LayerData>): string {
        const wms = L.tileLayer.wms(layer.url, {
            layers: layer.entries,
            format: 'image/png',
            transparent: true,
            attribution: '',
        });
        const layerid = new Date().getTime().toString();
        wms.addTo(map);

        layers.push({
            // TODO generate an ID with better format
            id: new Date().getTime().toString(),
            type: layer.type,
            layer: wms,
        });
        return layerid;
    }
}
