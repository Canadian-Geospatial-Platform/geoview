import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { TypeSourceEsriFeatureInitialConfig } from '@/geo/layer/geoview-layers/vector/esri-feature';
export declare class EsriFeatureLayerEntryConfig extends VectorLayerEntryConfig {
    source: TypeSourceEsriFeatureInitialConfig;
    /** Max number of records for query */
    maxRecordCount?: number;
    /**
     * The class constructor.
     * @param {EsriFeatureLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
     */
    constructor(layerConfig: EsriFeatureLayerEntryConfig);
}
//# sourceMappingURL=esri-feature-layer-entry-config.d.ts.map