import type { Extent } from 'ol/extent';

import type {
  ConfigClassOrType,
  TypeGeoviewLayerConfig,
  TypeMetadataWMS,
  TypeMetadataWMSCapabilityLayer,
  TypeMetadataWMSCapabilityLayerStyle,
  TypeOfServer,
  TypeSourceImageWmsInitialConfig,
} from '@/api/types/layer-schema-types';
import { CONST_LAYER_ENTRY_TYPES, CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import { LayerConfigWFSMissingError } from '@/core/exceptions/layer-exceptions';
import type { OgcWfsLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/wfs-layer-entry-config';
import type { AbstractBaseLayerEntryConfigProps } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import type { TypeWMSLayerConfig } from '@/geo/layer/geoview-layers/raster/wms';
import { Projection } from '@/geo/utils/projection';
import { WFS } from '@/geo/layer/geoview-layers/vector/wfs';

export interface OgcWmsLayerEntryConfigProps extends AbstractBaseLayerEntryConfigProps {
  /** Source settings to apply to the GeoView layer source at creation time. */
  source?: TypeSourceImageWmsInitialConfig;
}

/**
 * Type used to define a GeoView image layer to display on the map.
 */
export class OgcWmsLayerEntryConfig extends AbstractBaseLayerEntryConfig {
  /** The associated WFS layer config, if any */
  #wfsLayerConfig?: OgcWfsLayerEntryConfig;

  /** The supported styles */
  #styles: string[] | undefined;

  /**
   * The class constructor.
   * @param {OgcWmsLayerEntryConfigProps} layerConfig - The layer configuration we want to instanciate.
   */
  constructor(layerConfig: OgcWmsLayerEntryConfigProps) {
    super(layerConfig, CONST_LAYER_TYPES.WMS, CONST_LAYER_ENTRY_TYPES.RASTER_IMAGE);

    // Normalize the access paths
    this.#normalizeMetadataAndDataAccessPaths();

    // Get the wms Style if any
    const { wmsStyle } = this.getSource();

    // If any wms styles in the config
    if (wmsStyle) {
      // If an array
      if (Array.isArray(wmsStyle)) {
        this.#styles = wmsStyle;
      } else {
        this.#styles = [wmsStyle];
      }
    }
  }

  // #region OVERRIDES

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {TypeSourceImageWmsInitialConfig} The strongly-typed source configuration specific to this layer entry config.
   */
  override getSource(): TypeSourceImageWmsInitialConfig {
    return super.getSource();
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {TypeMetadataWMS | undefined} The strongly-typed layer configuration specific to this layer entry config.
   */
  override getServiceMetadata(): TypeMetadataWMS | undefined {
    return super.getServiceMetadata() as TypeMetadataWMS | undefined;
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {TypeMetadataWMSCapabilityLayer | undefined} The strongly-typed layer metadata specific to this layer entry config.
   */
  override getLayerMetadata(): TypeMetadataWMSCapabilityLayer | undefined {
    return super.getLayerMetadata() as TypeMetadataWMSCapabilityLayer | undefined;
  }

  /**
   * Retrieves the attributions associated with the layer.
   * If attributions are not yet cached, this method attempts
   * to read them from the layer's metadata (via the `Attribution.Title` property)
   * and sets them accordingly. Once set, the attributions are cached in the layer.
   * @returns {string[] | undefined} The list of layer attributions, or `undefined` if none are available.
   */
  override getAttributions(): string[] | undefined {
    // If no attributions defined
    if (!super.getAttributions()) {
      // Read attributions in the metadata
      const attribution = this.getLayerMetadata()?.Attribution?.Title;

      // If any
      if (attribution) {
        // Set it
        super.setAttributions([attribution]);
      }
    }

    // Return it
    return super.getAttributions();
  }

  // #endregion OVERRIDES

  // #region METHODS

  /**
   * Gets the version. Defaults to 1.3.0.
   * @returns {string} The service version as read from the metadata attribute.
   */
  getVersion(): string {
    return this.getServiceMetadata()?.version || '1.3.0';
  }

  /**
   * Gets the server type as read from the config or as read from the service GetCapabilities metadata response.
   * @returns {TypeOfServer | undefined} The Type of server if it could be determined.
   */
  getServerType(): TypeOfServer | undefined {
    // Return the serverType as specified in the config if any or the serverType as read from the metadata (config > metadata)
    return this.getSource().serverType || this.getServiceMetadata()?.serverType;
  }

  /**
   * Returns a list of supported CRS (Coordinate Reference System) identifiers
   * from the WMS service metadata.
   * @returns {string[]} An array of supported CRS identifiers (e.g., 'EPSG:3857').
   */
  getSupportedCRSs(): string[] {
    return this.getServiceMetadata()?.Capability.Layer.CRS ?? [];
  }

  /**
   * Gets if the config has specified that we should fetch the vectorial information from the WFS.
   * @returns {boolean} True when the vector information should be fetched from the WFS. True by default.
   */
  getShouldFetchVectorInformationFromWFS(): boolean {
    return (this.getGeoviewLayerConfig() as TypeWMSLayerConfig).fetchVectorsOnWFS ?? true; // default: true
  }

  /**
   * Gets if the service supports 'GetStyles' requests.
   * @returns {boolean} True when the service supports GetStyles requests.
   */
  getSupportsGetStyles(): boolean {
    return (
      !!this.getServiceMetadata()?.Capability.Request['qgs:GetStyles'] || !!this.getServiceMetadata()?.Capability.Request['ms:GetStyles']
    );
  }

  /**
   * Retrieves the list of style names available for this layer.
   * If styles are not yet cached, the method reads them from the layer metadata
   * and initializes the internal style list. The styles correspond to named
   * style definitions advertised by the WMS service (from the `Style` section of the metadata).
   * @returns {string[] | undefined} The list of available style names, or `undefined` if none are defined.
   */
  getStyles(): string[] | undefined {
    // If no styles defined
    if (!this.#styles) {
      // Read styles from the metadata
      const styles = this.getLayerMetadata()?.Style;

      // Update internal styles list
      if (styles?.length || 0 > 1) {
        this.#styles = styles!.map((style) => style.Name);
      }
    }

    // Return them
    return this.#styles;
  }

  /**
   * Determines the style to apply for this layer.
   * Retrieves the list of available styles from the layer config/metadata and returns
   * the first available one as the default style to use. If no styles are defined,
   * the method returns `undefined`.
   * @returns {string | undefined} The name of the style to use, or `undefined` if no styles are available.
   */
  getStyleToUse(): string | undefined {
    // Redirect
    const styles = this.getStyles();
    if (styles && styles.length > 0) {
      // Return the first one
      return styles[0];
    }

    // None
    return undefined;
  }

  /**
   * Retrieves the legend image URL associated with the current WMS layer style.
   * Determines which style to use in the following order of priority:
   * 1. The explicitly provided `chosenStyle` parameter.
   * 2. The layer's configured `source.wmsStyle` value.
   * 3. The style named `"default"`, if available.
   * 4. The first available style in the metadata.
   * Once the target style is identified, the method searches its `LegendURL` entries
   * for one in `"image/png"` format and returns the corresponding `OnlineResource` URL.
   * @param {string} [chosenStyle] - Optional style name to prioritize.
   * @returns {string | undefined} The legend image URL if found; otherwise `undefined`.
   */
  getLegendUrl(chosenStyle?: string): string | undefined {
    // Get the capabilities metadata from the layer config
    const layerCapabilities = this.getLayerMetadata();
    const styles = layerCapabilities?.Style;

    // Return early if there are no styles defined
    if (!Array.isArray(styles)) return undefined;

    // Check whether a style named 'default' exists
    const hasDefaultStyle = styles.some((style) => style.Name === 'default');

    let selectedStyle: TypeMetadataWMSCapabilityLayerStyle | undefined;

    if (chosenStyle) {
      // Use explicitly chosen style if provided
      selectedStyle = styles.find((style) => style.Name === chosenStyle);
    } else if (typeof this.getSource()?.wmsStyle === 'string') {
      // If source.wmsStyle is defined and not an array, use that
      selectedStyle = styles.find((style) => style.Name === this.getSource().wmsStyle);
    } else {
      // No chosen style; prefer 'default' if available, else use the first style
      selectedStyle = hasDefaultStyle ? styles.find((style) => style.Name === 'default') : styles[0];
    }

    // Look for a legend URL in the selected style, preferring PNG format
    return selectedStyle?.LegendURL?.find((url) => url.Format === 'image/png')?.OnlineResource['@attributes']['xlink:href'];
  }

  /**
   * Gets the bounds as defined in the metadata, favoring the ones in the given projection or returning the first one found
   * @param {string} projection - The projection to favor when looking for the bounds inside the metadata
   * @returns {[string, Extent]} The projection and its extent as provided by the metadata
   */
  getBoundsExtent(projection: string): [string, Extent] | undefined {
    // Get the bounding boxes in the metadata
    const boundingBoxes = this.getServiceMetadata()?.Capability.Layer.BoundingBox;

    // If found any
    if (boundingBoxes) {
      // Find the one with the right projection
      for (let i = 0; i < boundingBoxes.length; i++) {
        // Read the extent info from the GetCap
        const { CRS, extent } = boundingBoxes[i]['@attributes'];

        // If it's the crs we want
        if (CRS === projection) {
          const extentSafe: Extent = Projection.readExtentCarefully(CRS, extent!);
          return [CRS, extentSafe];
        }
      }

      // At this point, none could be found. If there's any to go with, we try our best...
      if (boundingBoxes.length > 0) {
        // Take the first one and return the bounds and projection
        const { CRS, extent } = boundingBoxes[0]['@attributes'];
        const extentSafe: Extent = Projection.readExtentCarefully(CRS, extent!);
        return [CRS, extentSafe];
      }
    }

    // Really not found
    return undefined;
  }

  /**
   * Gets the WFS styles layer id associated with this WMS layer entry config, defaults on the same layer id as the WMS.
   * @returns {string} The WFS styles layer id
   */
  getWfsStylesLayerId(): string {
    return this.layerEntryProps.wfsLayerId || this.layerId;
  }

  /**
   * Gets if the WMS layer has an associated WFS layer configuration.
   * @returns {boolean} True if the WMS layer has an associated WFS layer configuration.
   */
  hasWfsLayerConfig(): boolean {
    return !!this.#wfsLayerConfig;
  }

  /**
   * Gets the associated WFS layer configuration for this WMS layer.
   * Throws an error if the configuration has not been set.
   * @returns {OgcWfsLayerEntryConfig} The WFS layer configuration instance.
   * @throws {LayerConfigWFSMissingError} If no WFS layer configuration is defined for this WMS layer.
   */
  getWfsLayerConfig(): OgcWfsLayerEntryConfig {
    if (this.#wfsLayerConfig) return this.#wfsLayerConfig;
    throw new LayerConfigWFSMissingError(this.layerPath);
  }

  /**
   * Associates a WFS layer configuration with this WMS layer.
   * @param {OgcWfsLayerEntryConfig} layerConfig - The WFS layer configuration to associate.
   * @returns {void}
   */
  setWfsLayerConfig(layerConfig: OgcWfsLayerEntryConfig): void {
    this.#wfsLayerConfig = layerConfig;
  }

  /**
   * Asynchronously creates and returns a GeoView WFS layer configuration based on the current WMS configuration.
   * This method builds a WFS (Web Feature Service) layer configuration by:
   * 1. Retrieving the metadata access path from the current layer configuration.
   * 2. Using `WFS.processGeoviewLayerConfig` to generate WFS layer configurations.
   * 3. Modifying each generated entry to include the current WMS layer ID.
   * 4. Returning the first generated WFS layer configuration.
   * @returns {Promise<OgcWfsLayerEntryConfig>} A promise that resolves to the first generated WFS layer entry configuration.
   * @async
   */
  async createGeoviewLayerConfigWfs(): Promise<OgcWfsLayerEntryConfig> {
    // The base url
    let url = this.getMetadataAccessPath()!;

    // Tweak url, all the time, typical wms/wfs url
    url = url.replaceAll('cgi-bin/wms', 'cgi-bin/wfs');

    // Initializes a WFS layer config
    const layerConfigs = await WFS.processGeoviewLayerConfig(
      'wfsConfigForWms',
      `Temporary WFS layer config for the WMS layer '${this.getLayerNameCascade()}'`,
      url,
      [this.getWfsStylesLayerId() || this.layerId],
      false,
      'all',
      false, // Don't fetch styles from the WMS, we already are working with the WMS, we only want the vector information, prevents a "loop"
      (entryConfig) => {
        // eslint-disable-next-line no-param-reassign
        entryConfig.wmsLayerId = this.layerId; // Assign itself as the wms layer id obviously
        return entryConfig;
      }
    );

    // Get the first layer config
    return layerConfigs[0] as OgcWfsLayerEntryConfig;
  }

  /**
   * Normalizes both the metadata and data access paths by replacing legacy wrapper segments in the URL.
   * Specifically, this method replaces `wrapper/ramp/ogc` with `ows` in the metadata access path,
   * then applies the normalized value to both the metadata and data access paths.
   * This ensures consistency between the two paths and supports updated endpoint structures.
   * @throws {LayerDataAccessPathMandatoryError} When the Data Access Path was undefined, likely because initDataAccessPath wasn't called.
   * @private
   */
  #normalizeMetadataAndDataAccessPaths(): void {
    // Get the metadata access path
    let metadataAccessPath = this.getMetadataAccessPath()!;

    // Normalize it
    metadataAccessPath = metadataAccessPath.replace('wrapper/ramp/ogc', 'wrapper/ogc');

    // Set the normalized url in the metadata access path
    this.setMetadataAccessPath(metadataAccessPath);

    // Get the data access path
    let dataAccessPath = this.getDataAccessPath();

    // If any, normalize it as well in case the provided one also needed to be normalized
    if (dataAccessPath) {
      // Normalize it
      dataAccessPath = dataAccessPath.replace('wrapper/ramp/ogc', 'wrapper/ogc');
    } else {
      // No data access path was provided, use the newly normalized metadata access path
      dataAccessPath = metadataAccessPath;
    }

    // Save the normalized url in the data access path
    this.setDataAccessPath(dataAccessPath);
  }

  // #region OVERRIDES

  // #region STATIC METHODS

  /**
   * Type guard that checks whether the given configuration (class instance or plain object)
   * represents a WMS layer type.
   * Supports `ConfigClassOrType` (class instance or plain object) and plain layer config objects (`TypeGeoviewLayerConfig`).
   * @param {ConfigClassOrType | TypeGeoviewLayerConfig} layerConfig - The layer config to check. Can be an instance of a config class or a raw config object.
   * @returns `true` if the config is for a WMS layer; otherwise `false`.
   * @static
   */
  static isClassOrTypeWMS(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig): layerConfig is TypeWMSLayerConfig {
    // Redirect
    return this.isClassOrTypeSchemaTag(layerConfig, CONST_LAYER_TYPES.WMS);
  }

  // #region STATIC METHODS
}
