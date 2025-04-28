import { TypeJsonObject } from '@/api/config/types/config-types';
import { TypeFeatureInfoLayerConfig } from '@/api/config/types/map-schema-types';
import { AbstractBaseLayerEntryConfig } from '@/api/config/types/classes/sub-layer-config/leaf/abstract-base-layer-entry-config';
/**
 * Base type used to define the common implementation of an ESRI GeoView sublayer to display on the map.
 */
export declare abstract class AbstractBaseEsriLayerEntryConfig extends AbstractBaseLayerEntryConfig {
    #private;
    /**
     * This method is used to fetch, parse and extract the relevant information from the metadata of the leaf node.
     * The same method signature is used by layer group nodes and leaf nodes (layers).
     * @override @async
     */
    fetchLayerMetadata(): Promise<void>;
    /**
     * This method is used to parse the layer metadata and extract the style, source information and other properties.
     * @override @protected
     */
    protected parseLayerMetadata(): void;
    /**
     * This method will create a Geoview temporal dimension if it exist in the service metadata.
     *
     * @param {TypeJsonObject} timeDimension The ESRI time dimension object.
     * @protected
     */
    protected processTemporalDimension(timeDimension: TypeJsonObject): void;
    /**
     * This method creates the feature information from the layer metadata.
     *
     * @returns {TypeFeatureInfoLayerConfig} The feature information in the viewer format.
     * @protected
     */
    protected createFeatureInfoUsingMetadata(): TypeFeatureInfoLayerConfig;
}
