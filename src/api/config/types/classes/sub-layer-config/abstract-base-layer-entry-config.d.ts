import { TypeJsonObject } from '@config/types/config-types';
import { AbstractGeoviewLayerConfig } from '@config/types/classes/geoview-config/abstract-geoview-layer-config';
import { TypeDisplayLanguage, TypeLayerInitialSettings, TypeBaseSourceInitialConfig, TypeTemporalDimension, TypeStyleGeometry } from '@config/types/map-schema-types';
import { EntryConfigBaseClass } from '@/api/config/types/classes/sub-layer-config/entry-config-base-class';
/**
 * Base type used to define a GeoView sublayer to display on the map.
 */
export declare abstract class AbstractBaseLayerEntryConfig extends EntryConfigBaseClass {
    #private;
    /** The geometry type of the leaf node. */
    geometryType: TypeStyleGeometry;
    /** Source settings to apply to the GeoView vector layer source at creation time. */
    source?: TypeBaseSourceInitialConfig;
    /** Optional temporal dimension. */
    temporalDimension?: TypeTemporalDimension;
    /**
     * The class constructor.
     * @param {TypeJsonObject} layerConfig The sublayer configuration we want to instanciate.
     * @param {TypeLayerInitialSettings} initialSettings The initial settings inherited.
     * @param {TypeDisplayLanguage} language The initial language to use when interacting with the map features configuration.
     * @param {AbstractGeoviewLayerConfig} geoviewLayerConfig The GeoView instance that owns the sublayer.
     * @param {EntryConfigBaseClass} parentNode The The parent node that owns this layer or undefined if it is the root layer.
     * @constructor
     */
    constructor(layerConfig: TypeJsonObject, initialSettings: TypeLayerInitialSettings, language: TypeDisplayLanguage, geoviewLayerConfig: AbstractGeoviewLayerConfig, parentNode?: EntryConfigBaseClass);
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
