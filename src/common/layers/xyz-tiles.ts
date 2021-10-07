/**
 * a class to add xyz-tiles layer
 *
 * @export
 * @class XYZ_TILES
 */

import L, { Layer } from 'leaflet';
import { LayerConfig } from './layer';

// TODO: Implement method to validate XYZ tile service
//
// NOTE: The signature of tile services may vary depending of if it's a dynamic or static tile service. Dynamic tile services solutions like TiTiler allows users 
// to define query parameters such as a COG url, a TileMatrixSet and a resampling method.
// e.g.: http://{s}.somedomain.com/blabla/{z}/{x}/{y}{r}.png?url=http://smtg/cog.tif&TileMatrixSetId=CanadianNAD83_LCC&resampling_method=bilinear


// TODO: Add more customization (minZoom, maxZoom, TMS)

 export class XYZ_TILES {
    /**
    * Add a XYZ Tiles layer to the map.
    *
    * @param {LayerConfig} layer the layer configuration
    * @return {Promise<Layer | string>} layers to add to the map
    */
    add(layer: LayerConfig): Promise<Layer | string> {

        let { url } = layer;

        const geo = new Promise<Layer | string>((resolve) => {
            const xyzTiles = L.tileLayer(layer.url);
            resolve(xyzTiles);  
        });  
            
    return new Promise((resolve) => resolve(geo));
    }
}
