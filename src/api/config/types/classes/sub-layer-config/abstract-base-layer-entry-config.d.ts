import { TypeJsonObject } from '@config/types/config-types';
import { TypeBaseSourceInitialConfig, TypeTemporalDimension, TypeStyleGeometry } from '@config/types/map-schema-types';
import { EntryConfigBaseClass } from '@/api/config/types/classes/sub-layer-config/entry-config-base-class';
/**
 * Base type used to define a GeoView sublayer to display on the map.
 */
export declare abstract class AbstractBaseLayerEntryConfig extends EntryConfigBaseClass {
    #private;
    /** The geometry type of the leaf node. */
    geometryType?: TypeStyleGeometry;
    /** Source settings to apply to the GeoView vector layer source at creation time. */
    source?: TypeBaseSourceInitialConfig;
    /** Optional temporal dimension. */
    temporalDimension?: TypeTemporalDimension;
    /**
     * Fetch the layer metadata from the metadataAccessPath and store it in a private variable of the sub-layer.
     *
     * @returns {Promise<void>} A Promise that will resolve when the execution will be completed.
     * @abstract
     */
    abstract fetchLayerMetadata(): Promise<void>;
    /**
     * The setter method that sets the metadata private property. The benifit of using a setter/getter with a
     * private #metadata is that it is invisible to the schema validation and JSON serialization.
     *
     * @param {TypeJsonObject} metadata The sub-layer metadata.
     * @protected
     */
    protected set metadata(metadata: TypeJsonObject);
    /**
     * The getter method that returns the metadata private property. The benifit of using a setter/getter with a
     * private #metadata is that it is invisible to the schema validation and JSON serialization.
     *
     * @returns {TypeJsonObject} The sub-layer metadata.
     * @protected
     */
    protected get metadata(): TypeJsonObject;
}
