import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { TypeSourceWFSVectorInitialConfig } from '@/geo/layer/geoview-layers/vector/wfs';
export declare class WfsLayerEntryConfig extends VectorLayerEntryConfig {
    source: TypeSourceWFSVectorInitialConfig;
    /**
     * The class constructor.
     * @param {WfsLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
     */
    constructor(layerConfig: WfsLayerEntryConfig);
}
