import type { Extent } from 'ol/extent';
import type { ConfigClassOrType, TypeGeoviewLayerConfig, TypeMetadataWMS, TypeMetadataWMSCapabilityLayer, TypeMetadataWMSCapabilityLayerStyle, TypeOfServer, TypeSourceImageWmsInitialConfig } from '@/api/types/layer-schema-types';
import type { OgcWfsLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/wfs-layer-entry-config';
import type { AbstractBaseLayerEntryConfigProps } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import type { TypeWMSLayerConfig } from '@/geo/layer/geoview-layers/raster/wms';
export interface OgcWmsLayerEntryConfigProps extends AbstractBaseLayerEntryConfigProps {
    /** Source settings to apply to the GeoView layer source at creation time. */
    source?: TypeSourceImageWmsInitialConfig;
}
/** Type used to define a GeoView image layer to display on the map. */
export declare class OgcWmsLayerEntryConfig extends AbstractBaseLayerEntryConfig {
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
     * @returns The strongly-typed layer configuration specific to this layer.
     */
    getGeoviewLayerConfig(): TypeWMSLayerConfig;
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed source configuration specific to this layer entry config.
     */
    getSource(): TypeSourceImageWmsInitialConfig;
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed service metadata specific to this layer entry config.
     */
    getServiceMetadata(): TypeMetadataWMS | undefined;
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed layer metadata specific to this layer entry config.
     */
    getLayerMetadata(): TypeMetadataWMSCapabilityLayer | undefined;
    /**
     * Retrieves the attributions associated with the layer.
     *
     * If attributions are not yet cached, this method attempts
     * to read them from the layer's metadata (via the `Attribution.Title` property)
     * and sets them accordingly. Once set, the attributions are cached in the layer.
     *
     * @returns The list of layer attributions, or `undefined` if none are available.
     */
    getAttributions(): string[] | undefined;
    /**
     * Gets the version. Defaults to 1.1.0.
     *
     * @returns The service version as read from the metadata attribute
     */
    getVersion(): string;
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
     * Gets if the config has specified that we should fetch the vectorial information from the WFS.
     *
     * @returns True when the vector information should be fetched from the WFS. True by default
     */
    getShouldFetchVectorInformationFromWFS(): boolean;
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
     * @returns The list of available style names, or `undefined` if none are defined.
     */
    getStyles(): string[] | undefined;
    /**
     * Retrieves the full style metadata objects available for this layer.
     *
     * Returns the complete `TypeMetadataWMSCapabilityLayerStyle` objects from the layer metadata,
     * which include style names, legend URLs, and other style-related information.
     *
     * @returns The list of available style metadata objects, or `undefined` if none are defined.
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
     * Gets the WFS styles layer id associated with this WMS layer entry config, defaults on the same layer id as the WMS.
     *
     * @returns The WFS styles layer id
     */
    getWfsStylesLayerId(): string;
    /**
     * Gets if the WMS layer has an associated WFS layer configuration.
     *
     * @returns True if the WMS layer has an associated WFS layer configuration
     */
    hasWfsLayerConfig(): boolean;
    /**
     * Gets the associated WFS layer configuration for this WMS layer.
     * Throws an error if the configuration has not been set.
     *
     * @returns The WFS layer configuration instance
     * @throws {LayerConfigWFSMissingError} When no WFS layer configuration is defined for this WMS layer
     */
    getWfsLayerConfig(): OgcWfsLayerEntryConfig;
    /**
     * Associates a WFS layer configuration with this WMS layer.
     *
     * @param layerConfig - The WFS layer configuration to associate
     */
    setWfsLayerConfig(layerConfig: OgcWfsLayerEntryConfig): void;
    /**
     * Asynchronously creates and returns a GeoView WFS layer configuration based on the current WMS configuration.
     *
     * This method builds a WFS (Web Feature Service) layer configuration by:
     * 1. Retrieving the metadata access path from the current layer configuration.
     * 2. Using `WFS.processGeoviewLayerConfig` to generate WFS layer configurations.
     * 3. Modifying each generated entry to include the current WMS layer ID.
     * 4. Returning the first generated WFS layer configuration.
     *
     * @returns A promise that resolves with the first generated WFS layer entry configuration
     */
    createGeoviewLayerConfigWfs(): Promise<OgcWfsLayerEntryConfig>;
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