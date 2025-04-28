import { TypeLayerEntryConfig } from '@/api/config/types/map-schema-types';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';
import { TypeJsonObject } from '@/api/config/types/config-types';
/** ******************************************************************************************************************************
 * Type used to define a layer group.
 */
export declare class GroupLayerEntryConfig extends ConfigBaseClass {
    /** Tag used to link the entry to a specific schema is not used by groups. */
    schemaTag: never;
    /** Layer entry data type. */
    entryType: import("@/api/config/types/map-schema-types").TypeLayerEntryType;
    /** The ending element of the layer configuration path is not used on groups. */
    layerIdExtension: never;
    /** Source settings to apply to the GeoView layer source at creation time is not used by groups. */
    source: never;
    /** The list of layer entry configurations to use from the GeoView layer group. */
    listOfLayerEntryConfig: TypeLayerEntryConfig[];
    /**
     * The class constructor.
     * @param {GroupLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
     */
    constructor(layerConfig: GroupLayerEntryConfig);
    /**
     * Overrides the serialization of the mother class
     * @returns {TypeJsonValue} The serialized TypeBaseLayerEntryConfig
     */
    onSerialize(): TypeJsonObject;
}
