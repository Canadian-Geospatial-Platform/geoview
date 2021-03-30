import { Layer } from 'leaflet';

import { dynamicMapLayer, mapService } from 'esri-leaflet';

import { LayerConfig } from './layer';
import { getXMLHttpRequest, getMapServerUrl } from '../utilities';

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
     * @param {LayerConfig} layer the layer configuration
     * @return {Promise<Layer | string>} layers to add to the map
     */
    add(layer: LayerConfig): Promise<Layer | string> {
        const data = getXMLHttpRequest(`${layer.url}?f=json`);

        const geo = new Promise<Layer | string>((resolve) => {
            data.then((value: string) => {
                // get layers from service and parse layer entries as number
                const { layers } = JSON.parse(value);
                let entries = layer.entries?.split(',').map((item: string) => {
                    return parseInt(item, 10);
                });
                entries = entries?.filter((item) => !Number.isNaN(item));

                // check if the entries are part of the service
                if (value !== '{}' && layers && layers.find((item) => entries?.includes(item.id))) {
                    const feat = dynamicMapLayer({
                        url: layer.url,
                        layers: entries,
                        attribution: '',
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
