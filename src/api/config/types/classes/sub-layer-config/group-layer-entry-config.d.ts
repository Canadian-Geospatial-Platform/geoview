import { TypeJsonObject } from '@config/types/config-types';
import { AbstractGeoviewLayerConfig } from '@config/types/classes/geoview-config/abstract-geoview-layer-config';
import { TypeDisplayLanguage, TypeLayerEntryType, TypeLayerInitialSettings } from '@config/types/map-schema-types';
import { EntryConfigBaseClass } from '@/api/config/types/classes/sub-layer-config/entry-config-base-class';
/**
 * Type used to define a group of layers. It can be either subgroups or sublayers.
 */
export declare class GroupLayerEntryConfig extends EntryConfigBaseClass {
    /** Layer entry data type. */
    entryType: TypeLayerEntryType;
    /** The list of layer entry configurations to use from the GeoView layer group. */
    listOfLayerEntryConfig: EntryConfigBaseClass[];
    /**
     * The class constructor.
     * @param {TypeJsonObject} layerConfig The sublayer configuration we want to instanciate.
     * @param {TypeDisplayLanguage} language The initial language to use when interacting with the geoview layer.
     * @param {AbstractGeoviewLayerConfig} geoviewLayerConfig The GeoView instance that owns the sublayer.
     * @param {EntryConfigBaseClass} parentNode The The parent node that owns this layer or undefined if it is the root layer.
     * @constructor
     */
    constructor(layerConfig: TypeJsonObject, language: TypeDisplayLanguage, geoviewLayerConfig: AbstractGeoviewLayerConfig, parentNode?: EntryConfigBaseClass);
    /**
     * Apply default value to undefined fields.
     */
    applyDefaultValueToUndefinedFields(initialSettings: TypeLayerInitialSettings): void;
    /**
     * @protected
     * The getter method that returns the schemaPath property. Each geoview sublayer type knows what section of the schema must be
     * used to do its validation.
     *
     * @returns {string} The schemaPath associated to the sublayer.
     */
    protected get schemaPath(): string;
    /**
     * @protected
     * A method that returns the entryType property. Each sublayer knows what entry type is associated to it.
     *
     * @returns {TypeLayerEntryType} The entryType associated to the sublayer.
     */
    protected getEntryType(): TypeLayerEntryType;
}
