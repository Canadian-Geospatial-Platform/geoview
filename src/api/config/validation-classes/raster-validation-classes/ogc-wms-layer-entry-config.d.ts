import type { Extent } from 'ol/extent';
import type { ConfigClassOrType, TypeGeoviewLayerConfig, TypeMetadataWMSCapabilities, TypeMetadataWMSCapabilityLayer, TypeMetadataWMSCapabilityLayerStyle, TypeOfServer, TypeSourceImageWmsInitialConfig } from '@/api/types/layer-schema-types';
import type { DisplayDateMode } from '@/api/types/map-schema-types';
import type { OgcWfsLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/wfs-layer-entry-config';
import type { OgcFeatureLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/ogc-layer-entry-config';
import type { AbstractBaseLayerEntryConfigProps } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import type { WmsGetStylesUrlAware } from '@/api/config/validation-classes/wms-get-styles-url-aware';
import { type TypeWMSLayerConfig } from '@/geo/layer/geoview-layers/raster/wms';
export interface OgcWmsLayerEntryConfigProps extends AbstractBaseLayerEntryConfigProps {
    /** Source settings to apply to the GeoView layer source at creation time. */
    source?: TypeSourceImageWmsInitialConfig;
}
/** Type used to define a GeoView image layer to display on the map. */
export declare class OgcWmsLayerEntryConfig extends AbstractBaseLayerEntryConfig implements WmsGetStylesUrlAware {
    #private;
    /**
     * Creates an instance of OgcWmsLayerEntryConfig.
     *
     * @param layerConfig - The layer configuration we want to instantiate
     */
    constructor(layerConfig: OgcWmsLayerEntryConfigProps);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed layer configuration specific to this layer
     */
    getGeoviewLayerConfig(): TypeWMSLayerConfig;
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed source configuration specific to this layer entry config
     */
    getSource(): TypeSourceImageWmsInitialConfig;
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed service metadata specific to this layer entry config
     */
    getServiceMetadata(): TypeMetadataWMSCapabilities | undefined;
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed layer metadata specific to this layer entry config
     */
    getLayerMetadata(): TypeMetadataWMSCapabilityLayer | undefined;
    /**
     * Retrieves the attributions associated with the layer.
     *
     * If attributions are not yet cached, this method attempts
     * to read them from the layer's metadata (via the `Attribution.Title` property)
     * and sets them accordingly. Once set, the attributions are cached in the layer.
     *
     * @returns The list of layer attributions, or `undefined` if none are available
     */
    getAttributions(): string[] | undefined;
    /**
     * Refreshes the layer metadata information by re-fetching the WMS GetCapabilities response and updating the layer configuration accordingly.
     *
     * This method is typically used when the display date mode changes, as the metadata may contain time-sensitive information that needs to be updated on-the-fly.
     *
     * @param displayDateMode - The display date mode that should be used
     * @returns A promise that resolves when the metadata refresh operation has completed
     * @throws {RequestTimeoutError} When the request exceeds the timeout duration
     * @throws {ResponseEmptyError} When the capabilities response is empty
     * @throws {NetworkError} When a network issue happened
     */
    onRefreshMetadata(displayDateMode: DisplayDateMode): Promise<void>;
    /**
     * Gets the version.
     *
     * @returns The service version as read from the metadata attribute
     */
    getVersion(): string | undefined;
    /**
     * Gets the version and defaults to 1.1.0 when couldn't be determined as it's the most stable in testing.
     *
     * @returns The service version as read from the metadata attribute, or '1.1.0' if not available
     */
    getVersionOrDefault(): string;
    /**
     * Gets the server type as read from the config or as read from the service GetCapabilities metadata response.
     *
     * @returns The type of server, or undefined if it could not be determined
     */
    getServerType(): TypeOfServer | undefined;
    /**
     * Returns a list of supported CRS (Coordinate Reference System) identifiers
     * from the WMS service metadata.
     *
     * @returns An array of supported CRS identifiers (e.g., 'EPSG:3857')
     */
    getSupportedCRSs(): string[];
    /**
     * Gets if the config has specified that we should fetch the vectorial information from an external service such as WFS or OGC API Feature.
     *
     * @returns True when the vector information should be fetched an external service. True by default
     */
    getShouldFetchVectorInformationExternally(): boolean;
    /**
     * Gets if the service supports 'GetStyles' requests.
     *
     * @returns True when the service supports GetStyles requests
     */
    getSupportsGetStyles(): boolean;
    /**
     * Retrieves the list of style names available for this layer.
     *
     * If styles are not yet cached, the method reads them from the layer metadata
     * and initializes the internal style list. The styles correspond to named
     * style definitions advertised by the WMS service (from the `Style` section of the metadata).
     *
     * @returns The list of available style names, or `undefined` if none are defined
     */
    getStyles(): string[] | undefined;
    /**
     * Retrieves the full style metadata objects available for this layer.
     *
     * Returns the complete `TypeMetadataWMSCapabilityLayerStyle` objects from the layer metadata,
     * which include style names, legend URLs, and other style-related information.
     *
     * @returns The list of available style metadata objects, or `undefined` if none are defined
     */
    getStylesMetadata(): TypeMetadataWMSCapabilityLayerStyle[] | undefined;
    /**
     * Determines the style to apply for this layer.
     *
     * Retrieves the list of available styles from the layer config/metadata and returns
     * the first available one as the default style to use. If no styles are defined,
     * the method returns `undefined`.
     *
     * @returns The name of the style to use, or `undefined` if no styles are available
     */
    getStyleToUse(): string | undefined;
    /**
     * Retrieves the legend image URL associated with the current WMS layer style.
     *
     * Determines which style to use in the following order of priority:
     * 1. The explicitly provided `chosenStyle` parameter.
     * 2. The layer's configured `source.wmsStyle` value.
     * 3. The style named `"default"`, if available.
     * 4. The first available style in the metadata.
     * Once the target style is identified, the method searches its `LegendURL` entries
     * for one in `"image/png"` format and returns the corresponding `OnlineResource` URL.
     *
     * @param chosenStyle - Optional style name to prioritize
     * @returns The legend image URL if found; otherwise `undefined`
     */
    getLegendUrl(chosenStyle?: string): string | undefined;
    /**
     * Gets the bounds as defined in the metadata, favoring the ones in the given projection or returning the first one found.
     *
     * @param projection - The projection to favor when looking for the bounds inside the metadata
     * @returns The projection and its extent as provided by the metadata, or undefined if not found
     */
    getBoundsExtent(projection: string): [string, Extent] | undefined;
    /**
     * Gets the full WMS GetStyles URL used to generate the style.
     *
     * @returns The recorded WMS GetStyles URL, or undefined if none was recorded
     */
    getWmsGetStylesFullUrl(): string | undefined;
    /**
     * Stores the full WMS GetStyles URL used to generate the style.
     *
     * @param wmsGetStylesFullUrl - Full URL of the WMS GetStyles request
     */
    setWmsGetStylesFullUrl(wmsGetStylesFullUrl: string | undefined): void;
    /**
     * Gets the explicitly configured WFS URL associated with this WMS layer.
     *
     * @returns The configured WFS URL, or undefined when none is configured
     */
    getWfsUrl(): string | undefined;
    /**
     * Gets the WFS URL, falling back to the layer data access path when none is configured.
     *
     * @returns The configured WFS URL or the layer data access path
     * @throws {LayerDataAccessPathMandatoryError} When neither a WFS URL nor a layer data access path is configured
     */
    getWfsUrlOrDefault(): string;
    /**
     * Gets the WFS styles layer id associated with this WMS layer entry config, defaults on the same layer id as the WMS.
     *
     * @returns The WFS styles layer id
     */
    getWfsLayerId(): string | undefined;
    /**
     * Gets the WFS styles layer id associated with this WMS layer entry config, defaults on the same layer id as the WMS.
     *
     * @returns The WFS styles layer id
     */
    getWfsLayerIdOrDefault(): string;
    /**
     * Sets the WFS layer ID associated with this WMS layer entry configuration.
     *
     * @param wfsLayerId - The WFS layer ID to set for this WMS layer entry configuration
     */
    setWfsLayerId(wfsLayerId: string): void;
    /**
     * Gets the associated WFS layer configuration for this WMS layer.
     *
     * @returns The WFS layer configuration instance associated with this WMS layer, or `undefined` if no association exists
     */
    getWfsLayerConfig(): OgcWfsLayerEntryConfig | undefined;
    /**
     * Associates a WFS layer configuration with this WMS layer.
     *
     * @param layerConfig - The WFS layer configuration to associate
     */
    setWfsLayerConfig(layerConfig: OgcWfsLayerEntryConfig): void;
    /**
     * Gets the explicitly configured OGC API Features URL associated with this WMS layer.
     *
     * @returns The configured OGC API Features URL, or undefined when none is configured
     */
    getOGCApiFeaturesUrl(): string | undefined;
    /**
     * Gets the OGC API Features URL, falling back to the layer data access path when none is configured.
     *
     * @returns The configured OGC API Features URL or the layer data access path
     * @throws {LayerDataAccessPathMandatoryError} When neither an OGC API Features URL nor a layer data access path is configured
     */
    getOGCApiFeaturesUrlOrDefault(): string;
    /**
     * Sets the OGC API Features URL associated with this WMS layer.
     *
     * @param url - The OGC API Features URL to set
     */
    setOGCApiFeaturesUrl(url: string): void;
    /**
     * Gets the explicitly configured OGC API Features layer ID associated with this WMS layer.
     *
     * @returns The configured OGC API Features layer ID, or undefined when none is configured
     */
    getOGCApiFeaturesLayerId(): string | undefined;
    /**
     * Gets the OGC API Features layer ID, falling back to the WMS layer ID when none is configured.
     *
     * @returns The configured OGC API Features layer ID or the WMS layer ID
     */
    getOGCApiFeaturesLayerIdOrDefault(): string;
    /**
     * Sets the OGC API Features layer ID associated with this WMS layer.
     *
     * @param layerId - The OGC API Features layer ID to set
     */
    setOGCApiFeaturesLayerId(layerId: string): void;
    /**
     * Gets the associated OGC API Features layer configuration for this WMS layer.
     *
     * @returns The OGC API Features layer configuration instance associated with this WMS layer, or `undefined` if no association exists
     */
    getOGCApiFeaturesLayerConfig(): OgcFeatureLayerEntryConfig | undefined;
    /**
     * Associates an OGC API Features layer configuration with this WMS layer.
     *
     * @param layerConfig - The OGC API Features layer configuration to associate
     */
    setOGCApiFeaturesLayerConfig(layerConfig: OgcFeatureLayerEntryConfig): void;
    /**
     * Gets the vector field configured for time filtering on the associated vector layer such as the WFS or OGC API Feature.
     *
     * @returns The configured vector time field, or `undefined` if none is set
     */
    getVectorTimeField(): string | undefined;
    /**
     * Gets whether the WMS layer was added as part of a group in the config.
     *
     * @returns True when the layer was added as part of a group
     */
    getAddedViaAGroup(): boolean;
    /**
     * Sets whether the WMS layer was added as part of a group in the config.
     *
     * @param addedViaGroup - True when the layer was added as part of a group
     */
    setAddedViaGroup(addedViaGroup: boolean): void;
    /**
     * Asynchronously creates and returns a GeoView WFS layer configuration based on the current WMS configuration.
     *
     * This method builds a WFS (Web Feature Service) layer configuration by:
     * 1. Retrieving the metadata access path from the current layer configuration.
     * 2. Using `WFS.processGeoviewLayerConfig` to generate WFS layer configurations.
     * 3. Modifying each generated entry to include the current WMS layer ID.
     * 4. Retrying with an `ms:` layer ID prefix when the service rejects the original layer ID as missing.
     * 5. Returning the first generated WFS layer configuration.
     *
     * @param configProxyUrl - Proxy URL to use when necessary
     * @returns A promise that resolves with the first generated WFS layer entry configuration
     * @throws {LayerDataAccessPathMandatoryError} When neither a WFS URL nor a layer data access path is configured
     * @throws {LayerServiceMetadataUnableToFetchError} When WFS service metadata cannot be fetched
     * @throws {LayerNoCapabilitiesError} When the WFS capabilities response is empty
     * @throws {LayerServiceMetadataEmptyError} When the WFS service metadata is incomplete
     * @throws {LayerEntryConfigLayerIdNotFoundError} When the WFS layer ID is not found after the optional `ms:` prefix retry
     * @throws {RequestTimeoutError} When the WFS DescribeFeatureType request exceeds the timeout duration
     * @throws {RequestAbortedError} When the WFS DescribeFeatureType request is aborted
     * @throws {ResponseError} When the WFS DescribeFeatureType response is not successful
     * @throws {ResponseEmptyError} When the WFS DescribeFeatureType response is empty
     * @throws {NetworkError} When the WFS DescribeFeatureType request encounters a network error
     */
    createGeoviewLayerConfigWfs(configProxyUrl: string | undefined): Promise<OgcWfsLayerEntryConfig>;
    /**
     * Creates an OGC API Features layer configuration from this WMS layer configuration.
     *
     * @param configProxyUrl - Optional proxy URL to use for service requests
     * @returns A promise that resolves with the generated OGC API Features layer entry configuration
     * @throws {LayerDataAccessPathMandatoryError} When neither an OGC API Features URL nor a layer data access path is configured
     * @throws {LayerServiceMetadataUnableToFetchError} When OGC API Features service metadata cannot be fetched
     * @throws {LayerEntryConfigLayerIdNotFoundError} When the requested collection is not found
     * @throws {LayerEntryConfigInvalidLayerEntryConfigError} When the OGC API Features service metadata is invalid
     * @throws {LayerMetadataAccessPathMandatoryError} When the collection queryables metadata path is not configured
     * @throws {RequestTimeoutError} When the collection queryables request exceeds the timeout duration
     * @throws {RequestAbortedError} When the collection queryables request is aborted
     * @throws {ResponseError} When the collection queryables response is not successful
     * @throws {ResponseEmptyError} When the collection queryables response is empty
     * @throws {NetworkError} When the collection queryables request encounters a network error
     */
    createGeoviewLayerConfigOGCApiFeatures(configProxyUrl: string | undefined): Promise<OgcFeatureLayerEntryConfig>;
    /**
     * Type guard that checks whether the given configuration (class instance or plain object) represents a WMS layer type.
     *
     * Supports `ConfigClassOrType` (class instance or plain object) and plain layer config objects (`TypeGeoviewLayerConfig`).
     *
     * @param layerConfig - The layer config to check. Can be an instance of a config class or a raw config object
     * @returns `true` if the config is for a WMS layer; otherwise `false`
     */
    static isClassOrTypeWMS(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig): layerConfig is TypeWMSLayerConfig;
}
//# sourceMappingURL=ogc-wms-layer-entry-config.d.ts.map