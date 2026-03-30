import type { TypeLayerEntryConfig } from '@/api/types/layer-schema-types';
import type { ConfigBaseClassProps } from '@/api/config/validation-classes/config-base-class';
import { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
export interface GroupLayerEntryConfigProps extends ConfigBaseClassProps {
    listOfLayerEntryConfig: TypeLayerEntryConfig[];
}
/**
 * Type used to define a layer group.
 */
export declare class GroupLayerEntryConfig extends ConfigBaseClass {
    /** The list of layer entry configurations to use from the GeoView layer group. */
    listOfLayerEntryConfig: TypeLayerEntryConfig[];
    /**
     * Creates an instance of GroupLayerEntryConfig.
     *
     * @param layerConfig - The layer configuration we want to instantiate
     */
    constructor(layerConfig: GroupLayerEntryConfigProps);
    /**
     * Overrides the setting of the service metadata to do it for all layer entries in the configuration.
     *
     * This method overrides a base implementation to recursively apply the provided
     * `metadata` to each entry in `listOfLayerEntryConfig`. It ensures that
     * all nested or child layer entries also receive the updated metadata.
     *
     * @param metadata - The new service metadata to be used
     */
    protected onSetServiceMetadata(metadata: unknown): void;
    /**
     * Overrides the setting of the data access path to do it for all layer entries in the configuration.
     *
     * This method overrides a base implementation to recursively apply the provided
     * `dataAccessPath` to each entry in `listOfLayerEntryConfig`. It ensures that
     * all nested or child layer entries also receive the updated data access path.
     *
     * @param dataAccessPath - The new path to be used for accessing data
     */
    protected onSetDataAccessPath(dataAccessPath: string): void;
    /**
     * Overrides the creation of the layer props and return a deep clone of the layer entry configuration properties.
     *
     * This method calls the parent method and then copies the listOfLayerEntryConfig over.
     * The listOfLayerEntryConfig isn't deeply cloned.
     *
     * @returns A deep-cloned copy of the layer entry properties
     */
    protected onCloneLayerProps(): GroupLayerEntryConfigProps;
    /**
     * Overrides the toJson of the mother class.
     *
     * @returns The Json representation of the instance
     */
    protected onToJson<T>(): T;
    /**
     * Returns the `layerPath` values of all immediate child layers in `listOfLayerEntryConfig`.
     *
     * This method does **not** recurse into nested sublayers.
     *
     * @returns An array of `layerPath` strings for direct sublayers
     */
    getLayerPaths(): string[];
    /**
     * Recursively returns the `layerPath` values of all layers and sublayers starting from this layer.
     *
     * This includes the `layerPath` of the current layer, its direct children, and all nested descendants.
     *
     * @returns An array of `layerPath` strings for all descendant layers (including nested groups)
     */
    getLayerPathsAll(): string[];
}
//# sourceMappingURL=group-layer-entry-config.d.ts.map