import { Layer } from 'leaflet';

import { featureLayer, mapService } from 'esri-leaflet';

import { LayerConfig } from './layer';
import { getXMLHttpRequest, getMapServerUrl } from '../utilities';

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
     * @param {LayerConfig} layer the layer configuration
     * @return {Promise<Layer | string>} layers to add to the map
     */
    add(layer: LayerConfig): Promise<Layer | string> {
        const data = getXMLHttpRequest(`${layer.url}?f=json`);

        const geo = new Promise<Layer | string>((resolve) => {
            data.then((value: string) => {
                const { type } = JSON.parse(value);

                // check if the type is define as Feature Layer. If the entrie is bad, it will request the whole service
                // if the path is bad, return will be {}
                if (value !== '{}' && typeof type !== 'undefined' && type === 'Feature Layer') {
                    const feat = featureLayer({
                        url: layer.url,
                    });

                    Object.defineProperties(feat, {
                        mapService: {
                            value: mapService({
                                url: getMapServerUrl(layer.url),
                            }),
                        },
                    });

                    resolve(feat);
                } else {
                    resolve('{}');
                }
            });
        });

        return new Promise((resolve) => resolve(geo));
    }
}
