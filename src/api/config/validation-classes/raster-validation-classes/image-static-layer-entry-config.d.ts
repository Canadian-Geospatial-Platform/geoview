import { TypeSourceImageStaticInitialConfig } from '@/api/types/layer-schema-types';
import { AbstractBaseLayerEntryConfig, AbstractBaseLayerEntryConfigProps } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
export interface ImageStaticLayerEntryConfigProps extends AbstractBaseLayerEntryConfigProps {
    /** Source settings to apply to the GeoView layer source at creation time. */
    source: TypeSourceImageStaticInitialConfig;
}
/**
 * Type used to define a GeoView image layer to display on the map.
 */
export declare class ImageStaticLayerEntryConfig extends AbstractBaseLayerEntryConfig {
    /** Tag used to link the entry to a specific schema. */
    schemaTag: import("@/api/types/layer-schema-types").TypeGeoviewLayerType;
    /** Layer entry data type. */
    entryType: import("@/api/types/layer-schema-types").TypeLayerEntryType;
    /** The layer entry props that were used in the constructor. */
    layerEntryProps: ImageStaticLayerEntryConfigProps;
    /** Source settings to apply to the GeoView image layer source at creation time. */
    source: TypeSourceImageStaticInitialConfig;
    /**
     * The class constructor.
     * @param {ImageStaticLayerEntryConfigProps | ImageStaticLayerEntryConfig} layerConfig -  The layer configuration we want to instanciate.
     */
    constructor(layerConfig: ImageStaticLayerEntryConfigProps | ImageStaticLayerEntryConfig);
}
//# sourceMappingURL=image-static-layer-entry-config.d.ts.map