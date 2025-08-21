/* eslint-disable max-classes-per-file */
// We want more than 1 Error class here to save files
import { LayerError } from '@/core/exceptions/layer-exceptions';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';

// Classes in this file mostly inherit LayerEntryConfigError errors.

/**
 * Custom error class thrown when the configuration for a GeoView layer fails to load.
 * This error is used when there is a failure while loading or processing the configuration of a GeoView layer.
 * @extends {LayerError}
 */
export class LayerEntryConfigError extends LayerError {
  /** The configuration associated with the GeoView layer */
  readonly layerConfig: ConfigBaseClass;

  /**
   * Protected constructor to initialize the LayerEntryConfigError.
   * This error is typically thrown when a GeoView layer's configuration fails to load or process correctly.
   * @param {ConfigBaseClass} layerConfig - The configuration object associated with the GeoView layer.
   * @param {string} messageKey - A localization key. Defaults to 'validation.layer.loadfailed'.
   * @param {unknown[]} params - Optional parameters to customize the error message.
   */
  protected constructor(layerConfig: ConfigBaseClass, messageKey: string | undefined = undefined, params: unknown[] = []) {
    super(
      layerConfig.layerPath,
      messageKey || 'validation.layer.loadfailed',
      params || [layerConfig.layerName || layerConfig.geoviewLayerConfig.geoviewLayerName || layerConfig.layerId || layerConfig.layerPath]
    );

    // Keep the layer
    this.layerConfig = layerConfig;

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, LayerEntryConfigError.prototype);
  }
}

/**
 * Custom error class thrown when a GeoView layer configuration fails due to a missing or invalid layer ID.
 * This error is specifically used when the configuration for a GeoView layer is missing the expected layer ID.
 * @extends {LayerEntryConfigError}
 */
export class LayerEntryConfigLayerIdNotFoundError extends LayerEntryConfigError {
  /**
   * Constructor to initialize the LayerEntryConfigLayerIdNotFoundError.
   * This error is thrown when the layer ID is not found within the layer configuration.
   * @param {ConfigBaseClass} layerConfig - The configuration object associated with the GeoView layer.
   */
  constructor(layerConfig: ConfigBaseClass) {
    super(layerConfig, 'validation.layer.layerIdNotFound', [layerConfig.layerId, layerConfig.getLayerName()]);

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, LayerEntryConfigLayerIdNotFoundError.prototype);
  }
}

/**
 * Error thrown when invalid metadata in the listOfLayerEntryConfig prevents the loading of a layer.
 * @extends {LayerEntryConfigError}
 */
export class LayerEntryConfigInvalidLayerEntryConfigError extends LayerEntryConfigError {
  /**
   * Constructor to initialize the LayerEntryConfigInvalidLayerEntryConfigError.
   * This error is thrown when the metadata with regard to the listOfLayerEntryConfig is preventing to load the layer.
   * @param {ConfigBaseClass} layerConfig - The configuration object associated with the GeoView layer.
   */
  constructor(layerConfig: ConfigBaseClass) {
    super(layerConfig, 'validation.layer.invalidMetadata', [layerConfig.getLayerName()]);

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, LayerEntryConfigInvalidLayerEntryConfigError.prototype);
  }
}

/**
 * Custom error class thrown when the GeoView layer configuration is invalid due to an empty layer group.
 * This error is used when a layer group in the configuration is found to be empty, which is not allowed.
 * @extends {LayerEntryConfigError}
 */
export class LayerEntryConfigEmptyLayerGroupError extends LayerEntryConfigError {
  /**
   * Constructor to initialize the LayerEntryConfigEmptyLayerGroupError.
   * This error is thrown when a layer group in the configuration is found to be empty.
   * @param {ConfigBaseClass} layerConfig - The configuration object associated with the GeoView layer.
   */
  constructor(layerConfig: ConfigBaseClass) {
    super(layerConfig, 'validation.layer.emptyLayerGroup', [layerConfig.getLayerName()]);

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, LayerEntryConfigEmptyLayerGroupError.prototype);
  }
}

/**
 * Custom error class thrown when the GeoView layer configuration fails due to an inability to create a group layer.
 * This error is used when there is an issue with creating a group layer as part of the configuration process.
 * @extends {LayerEntryConfigError}
 */
export class LayerEntryConfigUnableToCreateGroupLayerError extends LayerEntryConfigError {
  /**
   * Constructor to initialize the LayerEntryConfigUnableToCreateGroupLayerError.
   * This error is thrown when the creation of a group layer in the configuration fails.
   * @param {ConfigBaseClass} layerConfig - The configuration object associated with the GeoView layer.
   */
  constructor(layerConfig: ConfigBaseClass) {
    super(layerConfig, 'validation.layer.unableToCreateGroupLayer', [layerConfig.getLayerName()]);

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, LayerEntryConfigUnableToCreateGroupLayerError.prototype);
  }
}

/**
 * Error thrown when a vector layer configuration is missing its required source URL.
 * This typically indicates an improperly defined `LayerEntryConfig` for a vector source.
 */
export class LayerEntryConfigVectorSourceURLNotDefinedError extends LayerEntryConfigError {
  /**
   * Creates a new LayerEntryConfigVectorSourceURLNotDefinedError.
   * @param {ConfigBaseClass} layerConfig - The layer configuration that is missing the vector source URL.
   */
  constructor(layerConfig: ConfigBaseClass) {
    super(layerConfig, 'validation.layer.vectorSourceUrlNotDefined', [layerConfig.getLayerName()]);

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, LayerEntryConfigVectorSourceURLNotDefinedError.prototype);
  }
}

/**
 * Error thrown when a vector tile layer's projection does not match the map's projection.
 * Vector tile layers must use the same spatial reference (projection) as the map.
 * This error occurs when a mismatch is detected between the layer's projection
 * and the map's configured projection, which may lead to rendering or alignment issues.
 * @extends {LayerEntryConfigError}
 */
export class LayerEntryConfigVectorTileProjectionNotMatchingMapProjectionError extends LayerEntryConfigError {
  /**
   * Creates an instance of LayerEntryConfigVectorTileProjectionNotMatchingMapProjectionError.
   * @param {ConfigBaseClass} layerConfig - The configuration object for the vector tile layer with the invalid projection.
   */
  constructor(layerConfig: ConfigBaseClass) {
    super(layerConfig, 'validation.layer.vectorTileLayerProjectionMismatch', [layerConfig.getLayerName()]);

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, LayerEntryConfigVectorTileProjectionNotMatchingMapProjectionError.prototype);
  }
}
/**
 * Error thrown when a specified WMS sub-layer cannot be found in the provided layer configuration.
 * This error typically occurs during layer validation when a WMS sub-layer ID is referenced in the configuration
 * but does not exist in the actual WMS capabilities or metadata for the given GeoView layer.
 * @extends {LayerEntryConfigError}
 */
export class LayerEntryConfigWMSSubLayerNotFoundError extends LayerEntryConfigError {
  /**
   * Creates an instance of LayerEntryConfigWMSSubLayerNotFoundError.
   * @param {ConfigBaseClass} layerConfig - The layer configuration object referencing the missing WMS sub-layer.
   * @param {string} geoviewLayerId - The ID of the GeoView WMS layer that was expected to contain the sub-layer.
   */
  constructor(layerConfig: ConfigBaseClass, geoviewLayerId: string) {
    super(layerConfig, 'validation.layer.wmsSubLayerNotfound', [layerConfig.layerId, geoviewLayerId]);

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, LayerEntryConfigWMSSubLayerNotFoundError.prototype);
  }
}

/**
 * Error thrown when the 'extent' parameter is not defined in the source element
 * of a layer configuration object.
 * This error is typically raised during validation or initialization of a layer
 * entry configuration when the required geographic extent information is missing.
 * @extends {LayerEntryConfigError}
 */
export class LayerEntryConfigParameterExtentNotDefinedInSourceError extends LayerEntryConfigError {
  /**
   * Constructs a new LayerEntryConfigParameterExtentNotDefinedInSourceError instance.
   * @param {ConfigBaseClass} layerConfig - The layer configuration that caused the error.
   */
  constructor(layerConfig: ConfigBaseClass) {
    super(layerConfig, 'validation.layer.extentParameterNotDefined', [layerConfig.getLayerName()]);

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, LayerEntryConfigParameterExtentNotDefinedInSourceError.prototype);
  }
}

/**
 * Error thrown when the 'projection' parameter is not defined in the source element
 * of a layer configuration object.
 * This error typically occurs during validation or initialization of a layer entry configuration
 * when the required spatial reference (projection) information is missing from the source definition.
 * @extends {LayerEntryConfigError}
 */
export class LayerEntryConfigParameterProjectionNotDefinedInSourceError extends LayerEntryConfigError {
  /**
   * Constructs a new LayerEntryConfigParameterProjectionNotDefinedInSourceError instance.
   * @param {ConfigBaseClass} layerConfig - The layer configuration object that caused the error.
   */
  constructor(layerConfig: ConfigBaseClass) {
    super(layerConfig, 'validation.layer.projectionParameterNotDefined', [layerConfig.getLayerName()]);

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, LayerEntryConfigParameterProjectionNotDefinedInSourceError.prototype);
  }
}
