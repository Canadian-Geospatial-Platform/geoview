import { LayerError } from '@/core/exceptions/layer-exceptions';
import type { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
/**
 * Custom error class thrown when the configuration for a GeoView layer fails to load.
 *
 * This error is used when there is a failure while loading or processing the configuration of a GeoView layer.
 */
export declare class LayerEntryConfigError extends LayerError {
    /** The configuration associated with the GeoView layer */
    readonly layerConfig: ConfigBaseClass;
    /**
     * Protected constructor to initialize the LayerEntryConfigError.
     *
     * This error is typically thrown when a GeoView layer's configuration fails to load or process correctly.
     *
     * @param layerConfig - The configuration object associated with the GeoView layer
     * @param messageKey - A localization key (defaults to 'validation.layer.loadfailed')
     * @param params - Optional parameters to customize the error message
     */
    protected constructor(layerConfig: ConfigBaseClass, messageKey?: string | undefined, params?: unknown[]);
}
/**
 * Custom error class thrown when a GeoView layer configuration fails due to a missing or invalid layer ID.
 *
 * This error is specifically used when the configuration for a GeoView layer is missing the expected layer ID.
 */
export declare class LayerEntryConfigLayerIdNotFoundError extends LayerEntryConfigError {
    /**
     * Creates an instance of LayerEntryConfigLayerIdNotFoundError.
     *
     * This error is typically thrown when a GeoView layer's configuration is missing the expected layer ID,
     * which is essential for identifying and loading the layer correctly.
     *
     * @param layerConfig - The configuration object associated with the GeoView layer
     */
    constructor(layerConfig: ConfigBaseClass);
}
/**
 * Error thrown when invalid metadata in the listOfLayerEntryConfig prevents the loading of a layer.
 */
export declare class LayerEntryConfigInvalidLayerEntryConfigError extends LayerEntryConfigError {
    /**
     * Creates an instance of LayerEntryConfigInvalidLayerEntryConfigError.
     *
     * This error is typically thrown when the metadata associated with a layer entry configuration is found to be invalid during the loading process,
     * which prevents the layer from being loaded successfully.
     *
     * @param layerConfig - The configuration object associated with the GeoView layer
     */
    constructor(layerConfig: ConfigBaseClass);
}
/**
 * Custom error class thrown when the GeoView layer configuration is invalid due to an empty layer group.
 *
 * This error is used when a layer group in the configuration is found to be empty, which is not allowed.
 */
export declare class LayerEntryConfigEmptyLayerGroupError extends LayerEntryConfigError {
    /**
     * Creates an instance of LayerEntryConfigEmptyLayerGroupError.
     *
     * This error is typically thrown when a layer group in the configuration is found to be empty,
     * which is not allowed.
     *
     * @param layerConfig - The configuration object associated with the GeoView layer
     */
    constructor(layerConfig: ConfigBaseClass);
}
/**
 * Custom error class thrown when the GeoView layer configuration fails due to an inability to create a group layer.
 *
 * This error is used when there is an issue with creating a group layer as part of the configuration process.
 */
export declare class LayerEntryConfigUnableToCreateGroupLayerError extends LayerEntryConfigError {
    /**
     * Creates an instance of LayerEntryConfigUnableToCreateGroupLayerError.
     *
     * This error is typically thrown when there is an issue with creating a group layer as part of the configuration process,
     *
     * @param layerConfig - The configuration object associated with the GeoView layer
     */
    constructor(layerConfig: ConfigBaseClass);
}
/**
 * Error thrown when a vector layer configuration is missing its required source URL.
 *
 * This typically indicates an improperly defined `LayerEntryConfig` for a vector source.
 */
export declare class LayerEntryConfigVectorSourceURLNotDefinedError extends LayerEntryConfigError {
    /**
     * Creates a new LayerEntryConfigVectorSourceURLNotDefinedError.
     *
     * @param layerConfig - The layer configuration that is missing the vector source URL
     */
    constructor(layerConfig: ConfigBaseClass);
}
/**
 * Error thrown when a layer entry projection does not support the map's projection.
 *
 * This error occurs when a mismatch is detected between the layer's supported projection
 * and the map's configured projection, which may lead to rendering or alignment issues.
 */
export declare class LayerEntryNotSupportingProjectionError extends LayerEntryConfigError {
    /**
     * Creates an instance of LayerEntryNotSupportingProjectionError.
     *
     * @param mapProjection - The map projection that the layer entry doesn't support
     * @param layerConfig - The configuration object for the vector tile layer with the invalid projection
     */
    constructor(mapProjection: string, layerConfig: ConfigBaseClass);
}
/**
 * Error thrown when a specified WMS sub-layer cannot be found in the provided layer configuration.
 *
 * This error typically occurs during layer validation when a WMS sub-layer ID is referenced in the configuration
 * but does not exist in the actual WMS capabilities or metadata for the given GeoView layer.
 */
export declare class LayerEntryConfigWMSSubLayerNotFoundError extends LayerEntryConfigError {
    /**
     * Creates an instance of LayerEntryConfigWMSSubLayerNotFoundError.
     *
     * @param layerConfig - The layer configuration object referencing the missing WMS sub-layer
     * @param geoviewLayerId - The ID of the GeoView WMS layer that was expected to contain the sub-layer
     */
    constructor(layerConfig: ConfigBaseClass, geoviewLayerId: string);
}
/**
 * Error thrown when the 'extent' parameter is not defined in the source element
 * of a layer configuration object.
 *
 * This error is typically raised during validation or initialization of a layer
 * entry configuration when the required geographic extent information is missing.
 */
export declare class LayerEntryConfigParameterExtentNotDefinedInSourceError extends LayerEntryConfigError {
    /**
     * Creates an instance of LayerEntryConfigParameterExtentNotDefinedInSourceError.
     *
     * @param layerConfig - The layer configuration that caused the error
     */
    constructor(layerConfig: ConfigBaseClass);
}
/**
 * Error thrown when the 'projection' parameter is not defined in the source element
 * of a layer configuration object.
 *
 * This error typically occurs during validation or initialization of a layer entry configuration
 * when the required spatial reference (projection) information is missing from the source definition.
 */
export declare class LayerEntryConfigParameterProjectionNotDefinedInSourceError extends LayerEntryConfigError {
    /**
     * Creates an instance of LayerEntryConfigParameterProjectionNotDefinedInSourceError.
     *
     * @param layerConfig - The layer configuration object that caused the error
     */
    constructor(layerConfig: ConfigBaseClass);
}
//# sourceMappingURL=layer-entry-config-exceptions.d.ts.map