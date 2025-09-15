import { TypeLayerEntryConfig } from '@/api/types/layer-schema-types';
import { ConfigBaseClass, ConfigBaseClassProps } from '@/api/config/validation-classes/config-base-class';
export interface GroupLayerEntryConfigProps extends ConfigBaseClassProps {
    listOfLayerEntryConfig: TypeLayerEntryConfig[];
}
/**
 * Type used to define a layer group.
 */
export declare class GroupLayerEntryConfig extends ConfigBaseClass {
    /** Layer entry data type. */
    entryType: import("@/api/types/layer-schema-types").TypeLayerEntryType;
    /** The layer entry props that were used in the constructor. */
    layerEntryProps: GroupLayerEntryConfigProps;
    /** Tag used to link the entry to a specific schema is not used by groups. */
    schemaTag: never;
    /** Source settings to apply to the GeoView layer source at creation time is not used by groups. */
    source: never;
    /** The list of layer entry configurations to use from the GeoView layer group. */
    listOfLayerEntryConfig: TypeLayerEntryConfig[];
    /**
     * The class constructor.
     * @param {GroupLayerEntryConfigProps | GroupLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
     */
    constructor(layerConfig: GroupLayerEntryConfigProps | GroupLayerEntryConfig);
    /**
     * Updates the data access path for all layer entries in the configuration.
     * This method overrides a base implementation to recursively apply the provided
     * `dataAccessPath` to each entry in `listOfLayerEntryConfig`. It ensures that
     * all nested or child layer entries also receive the updated data access path.
     * @param {string} dataAccessPath - The new path to be used for accessing data.
     */
    protected onSetDataAccessPath(dataAccessPath: string): void;
    /**
     * Overrides the creation of the layer props and return a deep clone of the layer entry configuration properties.
     * This method calls the parent method and then copies the listOfLayerEntryConfig over.
     * @returns {GroupLayerEntryConfigProps} A deep-cloned copy of the layer entry properties.
     */
    protected onCloneLayerProps(): GroupLayerEntryConfigProps;
    /**
     * Overrides the toJson of the mother class
     * @returns {T} The Json representation of the instance.
     * @protected
     */
    protected onToJson<T>(): T;
}
//# sourceMappingURL=group-layer-entry-config.d.ts.map