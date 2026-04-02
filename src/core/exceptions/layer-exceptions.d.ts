import type { TypeGeoviewLayerType, TypeLayerEntryType } from '@/api/types/layer-schema-types';
import { GeoViewError } from '@/core/exceptions/geoview-exceptions';
/**
 * Error related to a specific GeoView layer, extending GeoViewError with the layer ID.
 */
export declare class LayerError extends GeoViewError {
    /** The GeoView layer path or GeoView layer ID associated with this error. */
    readonly layerPathOrId: string;
    /**
     * Constructs a new LayerError.
     *
     * @param layerPathOrId - The layer ID associated with this error
     * @param messageKey - A localization key (defaults to generic error)
     * @param params - Optional localization parameters
     * @param options - Optional error options, including `cause`
     */
    constructor(layerPathOrId: string, messageKey: string, params?: unknown[], options?: ErrorOptions);
}
/**
 * Error thrown when a specified layer cannot be found.
 *
 * This error is typically raised when attempting to reference a layer that does not exist,
 * possibly due to an invalid path.
 */
export declare class LayerNotFoundError extends LayerError {
    /**
     * Constructs a new LayerNotFoundError instance.
     *
     * @param layerPath - The path or identifier of the missing layer
     */
    constructor(layerPath: string);
}
/**
 * Error thrown when a layer is expected to be a certain type but is not.
 */
export declare class LayerWrongTypeError extends LayerError {
    /**
     * Creates an instance of LayerWrongTypeError.
     *
     * @param layerPath - The path of the layer
     * @param layerName - The layer name
     */
    constructor(layerPath: string, layerName: string | undefined);
}
/**
 * Error thrown when a layer is expected to be a GeoJson layer but is not.
 */
export declare class LayerNotGeoJsonError extends LayerError {
    /**
     * Creates an instance of LayerNotGeoJsonError.
     *
     * @param layerPath - The path of the layer
     * @param layerName - The layer name
     */
    constructor(layerPath: string, layerName: string | undefined);
}
/**
 * Error thrown when a layer is expected to be an EsriDynamic layer but is not.
 */
export declare class LayerNotEsriDynamicError extends LayerError {
    /**
     * Creates an instance of LayerNotEsriDynamicError.
     *
     * @param layerPath - The path of the layer
     * @param layerName - The layer name
     */
    constructor(layerPath: string, layerName: string | undefined);
}
/**
 * Custom error class thrown when the GeoView layer configuration is invalid due to the EsriDynamic layer not supporting dynamic layers.
 */
export declare class LayerNotSupportingDynamicLayersError extends LayerError {
    /**
     * Creates an instance of LayerNotSupportingDynamicLayersError.
     *
     * This error is thrown when the EsriDynamic layer does not support dynamic layers.
     *
     * @param layerPath - The path of the layer
     * @param layerName - The layer name
     */
    constructor(layerPath: string, layerName: string | undefined);
}
/**
 * Custom error class thrown when the GeoView layer configuration is invalid due to the layer ID does not correspond to a feature layer.
 *
 * This error is specifically used when the provided layer ID does not correspond to a valid feature layer.
 */
export declare class LayerNotFeatureLayerError extends LayerError {
    /**
     * Creates an instance of LayerNotFeatureLayerError.
     *
     * This error is thrown when the layer ID provided does not correspond to a feature layer.
     *
     * @param layerPath - The path of the layer
     * @param layerName - The layer name
     */
    constructor(layerPath: string, layerName: string | undefined);
}
/**
 * Error thrown when a layer is not queryable.
 *
 * This typically means that the layer does not support feature queries, such as `GetFeatureInfo`,
 * attribute selection, or spatial filtering, either due to its type or configuration.
 */
export declare class LayerNotQueryableError extends LayerError {
    /**
     * Creates an instance of LayerNotQueryableError.
     *
     * @param layerPath - The path or identifier of the layer that is not queryable
     * @param layerName - The layer name
     */
    constructor(layerPath: string, layerName: string | undefined);
}
/**
 * Custom error class thrown when a GeoView layer status was 'error' when it was expecting another status.
 */
export declare class LayerStatusErrorError extends LayerError {
    /**
     * Creates an instance of LayerStatusErrorError.
     *
     * @param geoviewLayerId - The ID of the GeoView layer that had an error status
     * @param layerName - The layer name
     */
    constructor(geoviewLayerId: string, layerName: string | undefined);
}
/**
 * Error thrown when a GeoView layer has an invalid layer type.
 *
 * This typically indicates a configuration issue for a specific layer and its type.
 */
export declare class LayerInvalidGeoviewLayerTypeError extends LayerError {
    /**
     * Constructs a new LayerInvalidGeoviewLayerTypeError instance.
     *
     * @param geoviewLayerId - The ID of the GeoView layer with invalid layer type
     * @param geoviewLayerType - The Geoview layer type
     */
    constructor(geoviewLayerId: string, geoviewLayerType: TypeGeoviewLayerType | TypeLayerEntryType);
}
/**
 * Error thrown when a GeoView layer is missing a required `geoviewLayerId`.
 *
 * This typically indicates a configuration issue for a specific layer type.
 */
export declare class LayerMissingGeoviewLayerIdError extends LayerError {
    /**
     * Constructs a new LayerMissingGeoviewLayerIdError instance.
     *
     * @param geoviewLayerType - The Geoview layer type
     */
    constructor(geoviewLayerType: TypeGeoviewLayerType);
}
/**
 * Error thrown when a GeoView layer is missing a required `source.extent`.
 *
 * This typically indicates a configuration issue for a specific layer type.
 */
export declare class LayerMissingSourceExtentError extends LayerError {
    /**
     * Constructs a new LayerMissingSourceExtentError instance.
     */
    constructor();
}
/**
 * Error thrown when a GeoView layer is missing a required `source.projection`.
 *
 * This typically indicates a configuration issue for a specific layer type.
 */
export declare class LayerMissingSourceProjectionError extends LayerError {
    /**
     * Constructs a new LayerMissingSourceProjectionError instance.
     */
    constructor();
}
/**
 * Custom error class thrown when the GeoView layer configuration is invalid due to the ESRI layer ID is not a number.
 *
 * This error is used when the ESRI layer ID provided is expected to be a number, but it is not.
 */
export declare class LayerEntryConfigLayerIdEsriMustBeNumberError extends LayerError {
    /**
     * Creates an instance of LayerEntryConfigLayerIdEsriMustBeNumberError.
     *
     * This error is thrown when the ESRI layer ID is not a number, which is required for proper layer configuration.
     *
     * @param geoviewLayerId - The ID of the GeoView layer
     * @param badNumber - The invalid non-numeric layer ID
     * @param layerName - The layer name
     */
    constructor(geoviewLayerId: string, badNumber: string, layerName: string | undefined);
}
/**
 * Custom error class thrown when the GeoView layer configuration couldn't read the fields information from the vector metadata.
 */
export declare class LayerEntryConfigFieldsNotFoundError extends LayerError {
    /**
     * Creates an instance of LayerEntryConfigFieldsNotFoundError.
     *
     * This error is thrown when the fields information from the vector metadata couldn't be found.
     *
     * @param geoviewLayerId - The ID of the GeoView layer
     * @param layerName - The layer name
     */
    constructor(geoviewLayerId: string, layerName: string | undefined);
}
/**
 * Custom error class thrown when the ESRI feature layer has too many features.
 */
export declare class LayerTooManyEsriFeatures extends LayerError {
    /**
     * Creates an instance of LayerTooManyEsriFeatures.
     *
     * This error is thrown when the ESRI feature layer has more than 200 000 features.
     *
     * @param geoviewLayerId - The ID of the GeoView layer
     * @param layerName - The layer name
     * @param featureCount - The number of features that exceeded the limit
     */
    constructor(geoviewLayerId: string, layerName: string | undefined, featureCount: number);
}
/**
 * Custom error class thrown when the MetadataAccessPath is missing for a layer configuration.
 */
export declare class LayerMetadataAccessPathMandatoryError extends LayerError {
    /**
     * Constructs a new LayerMetadataAccessPathMandatoryError.
     *
     * @param geoviewLayerId - The ID of the GeoView layer missing a valid `metadataAccessPath`
     * @param geoviewLayerType - The Geoview layer type
     * @param layerName - The layer name
     */
    constructor(geoviewLayerId: string, geoviewLayerType: TypeGeoviewLayerType, layerName: string | undefined);
}
/**
 * Error thrown when a `dataAccessPath` is missing for a GeoView layer while `metadataAccessPath` is also undefined.
 *
 * This typically indicates a misconfigured layer source.
 */
export declare class LayerDataAccessPathMandatoryError extends LayerError {
    /**
     * Constructs a new LayerDataAccessPathMandatoryError.
     *
     * @param layerPath - The layer path of the layer entry missing a valid `dataAccessPath`
     * @param layerName - The layer name
     */
    constructor(layerPath: string, layerName: string | undefined);
}
/**
 * Custom error class for errors that occur when metadata for a GeoView layer cannot be fetched.
 *
 * This is typically used in scenarios where fetching or reading metadata for a specific service fails.
 */
export declare class LayerServiceMetadataUnableToFetchError extends LayerError {
    /**
     * Creates an instance of LayerServiceMetadataUnableToFetchError.
     *
     * @param geoviewLayerId - The ID of the GeoView layer related to the error
     * @param layerName - The layer name
     * @param cause - The underlying error that caused this exception
     */
    constructor(geoviewLayerId: string, layerName: string | undefined, cause: Error);
}
/**
 * Custom error class for errors that occur when metadata for a GeoView WMTS layer is missing necessary info.
 *
 * This is typically used in scenarios where user entered values don't exist in the metadata.
 */
export declare class LayerWMTSMetadataError extends LayerError {
    /**
     * Creates an instance of LayerWMTSMetadataError.
     *
     * @param geoviewLayerId - The ID of the GeoView layer related to the error
     * @param layerName - The layer name
     * @param missingElement - The element that is missing in the metadata
     */
    constructor(geoviewLayerId: string, layerName: string | undefined, missingElement: string);
}
/**
 * Custom error class for scenarios where the metadata of a GeoView layer service is empty.
 *
 * This error is typically thrown when a metadata request returns an empty response.
 */
export declare class LayerServiceMetadataEmptyError extends LayerError {
    /**
     * Creates an instance of LayerServiceMetadataEmptyError.
     *
     * @param geoviewLayerId - The ID of the GeoView layer whose metadata was empty
     * @param layerName - The layer name
     */
    constructor(geoviewLayerId: string, layerName: string | undefined);
}
/**
 * Error thrown when an invalid filter is applied to a layer.
 *
 * This typically occurs when a provided filter string doesn't match the expected format
 * or values for the target layer, which may cause issues in rendering or data querying.
 */
export declare class LayerInvalidLayerFilterError extends LayerError {
    /**
     * Creates an instance of LayerInvalidLayerFilterError.
     *
     * @param layerPath - The identifier or path to the layer with the invalid filter
     * @param layerName - The layer name
     * @param filter - The internal representation of the filter that caused the error
     * @param layerFilter - The filter string applied to the layer, if provided
     * @param cause - The original error that triggered this error
     */
    constructor(layerPath: string, layerName: string | undefined, filter: string, layerFilter: string | undefined, cause: Error);
}
/**
 * Custom error class thrown when a GeoView layer is attempted to be created more than once.
 *
 * This error is typically used when a layer is added to a map with an already existing layer ID.
 */
export declare class LayerCreatedTwiceError extends LayerError {
    /**
     * Creates an instance of LayerCreatedTwiceError.
     *
     * @param geoviewLayerId - The ID of the GeoView layer that was attempted to be created twice
     * @param layerName - The layer name
     */
    constructor(geoviewLayerId: string, layerName: string | undefined);
}
/**
 * Custom error class thrown when a GeoView layer creation fails.
 *
 * This error is typically used when a layer cannot be successfully created on the map.
 */
export declare class LayerNotCreatedError extends LayerError {
    /**
     * Creates an instance of LayerNotCreatedError.
     *
     * @param geoviewLayerId - The ID of the GeoView layer that failed to be created
     * @param layerName - The layer name
     */
    constructor(geoviewLayerId: string, layerName: string | undefined);
}
/**
 * Custom error class thrown when no capabilities are found (or capabilities are empty)
 * for a GeoView layer on a map.
 *
 * This error typically occurs when the capabilities for a specific layer are either not available
 * or not properly loaded for the given layer.
 */
export declare class LayerNoCapabilitiesError extends LayerError {
    /**
     * Creates an instance of LayerNoCapabilitiesError.
     *
     * @param geoviewLayerId - The ID of the GeoView layer that does not have capabilities
     * @param layerName - The layer name
     */
    constructor(geoviewLayerId: string, layerName: string | undefined);
}
/**
 * Error thrown when an unsupported `Format` parameter is used in a WMS `GetFeatureInfo` request.
 *
 * According to WMS standards, the `Format` parameter for `GetFeatureInfo` requests must be one of:
 * `text/xml`, `text/html`, or `text/plain`. This error indicates that a different or invalid format
 * was supplied.
 */
export declare class LayerInvalidFeatureInfoFormatWMSError extends LayerError {
    /**
     * Creates an instance of LayerInvalidFeatureInfoFormatWMSError.
     *
     * @param layerPath - The path or identifier of the WMS layer that received the invalid format
     * @param format - The invalid format
     * @param layerName - The layer name
     */
    constructor(layerPath: string, format: string | string[], layerName: string | undefined);
}
/**
 * Error thrown when no geographic data (e.g., coordinates or location fields) is found in a CSV sheet.
 *
 * This error typically occurs when attempting to load a CSV file as a map layer,
 * but the file does not contain recognizable geographic fields (such as latitude and longitude).
 */
export declare class LayerNoGeographicDataInCSVError extends LayerError {
    /**
     * Creates an instance of LayerNoGeographicDataInCSVError.
     *
     * @param layerPath - The identifier or path of the CSV layer lacking geographic data
     * @param layerName - The layer name
     */
    constructor(layerPath: string, layerName: string | undefined);
}
/**
 * Error thrown when fields provided to update the feature fields are of different lengths.
 */
export declare class LayerDifferingFieldLengthsError extends LayerError {
    /**
     * Constructs a new LayerDifferingFieldLengthsError instance.
     *
     * @param layerPath - The path or identifier of the layer
     */
    constructor(layerPath: string);
}
/**
 * Error thrown when the layer config WFS is missing for a given WMS layer.
 */
export declare class LayerConfigWFSMissingError extends LayerError {
    /**
     * Constructs a new LayerConfigWFSMissingError instance.
     *
     * @param layerPath - The path or identifier of the layer
     */
    constructor(layerPath: string);
}
/**
 * Custom error class thrown when feature data cannot be read or parsed.
 *
 * This error is typically used when feature parsing fails even after attempting to clean invalid data.
 */
export declare class LayerFeatureParsingError extends LayerError {
    /**
     * Creates an instance of LayerFeatureParsingError.
     *
     * @param geoviewLayerId - The ID of the GeoView layer with parsing errors
     * @param layerName - The layer name
     * @param cause - Optional underlying error that caused this exception
     */
    constructor(geoviewLayerId: string, layerName: string | undefined, cause?: Error);
}
//# sourceMappingURL=layer-exceptions.d.ts.map