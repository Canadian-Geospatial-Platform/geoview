import { AbstractGeoviewLayerConfig } from '@/api/config/types/classes/geoview-config/abstract-geoview-layer-config';
import { TypeJsonArray, TypeJsonObject } from '@/api/config/types/config-types';
import { TypeAppBarProps, TypeDisplayTheme, TypeExternalPackages, TypeFooterBarProps, TypeGlobalSettings, TypeMapComponents, TypeMapConfig, TypeMapCorePackages, TypeCorePackagesConfig, TypeNavBarProps, TypeOverviewMapProps, TypeServiceUrls } from '@/api/config/types/map-schema-types';
/**
 * The map feature configuration class.
 */
export declare class MapFeatureConfig {
    #private;
    /** map configuration. */
    map: TypeMapConfig;
    /** Display theme, default = geo.ca. */
    theme?: TypeDisplayTheme;
    /** Nav bar properies. */
    navBar?: TypeNavBarProps;
    /** Footer bar properies. */
    footerBar?: TypeFooterBarProps;
    /** App bar properies. */
    appBar?: TypeAppBarProps;
    /** Overview map properies. */
    overviewMap?: TypeOverviewMapProps;
    /** Map components. */
    components?: TypeMapComponents;
    /** List of core packages. */
    corePackages?: TypeMapCorePackages;
    /** List of core packages config. */
    corePackagesConfig?: TypeCorePackagesConfig;
    /** List of external packages. */
    externalPackages?: TypeExternalPackages;
    /** Global map settings */
    globalSettings: TypeGlobalSettings;
    /** Service URLs. */
    serviceUrls: TypeServiceUrls;
    /**
     * The schema version used to validate the configuration file. The schema should enumerate the list of versions accepted by
     * this version of the viewer.
     */
    schemaVersionUsed?: '1.0';
    /**
     * The class constructor
     *
     * All properties at this inheritance level have no values provided in the metadata. They are therefore initialized
     * from the configuration passed as a parameter or from the default values.
     *
     * @param {TypeJsonObject} userMapFeatureConfig The map feature configuration to instantiate.
     * @constructor
     */
    constructor(userMapFeatureConfig: TypeJsonObject);
    /**
     * The getter method that returns the errorDetected flag.
     *
     * @returns {boolean} The errorDetected property associated to the map feature config.
     */
    getErrorDetectedFlag(): boolean;
    /**
     * Methode used to set the MapFeatureConfig error flag to true.
     */
    setErrorDetectedFlag(): void;
    /**
     * Methode used to get a specific GeoView layer configuration.
     *
     * @param {string} geoviewLayerId The GeoView layer identifier.
     *
     * @returns {AbstractGeoviewLayerConfig | undefined} The GeoView layer object or undefined if it doesn't exist.
     */
    getGeoviewLayer(geoviewLayerId: string): AbstractGeoviewLayerConfig | undefined;
    /**
     * This method reads the service metadata for all geoview layers in the geoview layer list.
     */
    fetchAllServiceMetadata(): Promise<void>;
    /**
     * This method returns the json string of the map feature's configuration. The output representation is a multi-line indented
     * string. Indentation can be controled using the ident parameter. Private variables are not serialized.
     * @param {number} indent The number of space to indent the output string (default=2).
     *
     * @returns {string} The json string corresponding to the map feature configuration.
     */
    serialize(indent?: number): string;
    /**
     * Apply user configuration over the geoview layer configurations created from the raw metadata.
     */
    applyUserConfigToGeoviewLayers(listOfGeoviewLayerConfig?: TypeJsonArray): void;
    /**
     * The method used to implement the class factory model that returns the instance of the class based on the GeoView layer type
     * needed.
     *
     * @param {TypeJsonObject} layerConfig The layer configuration we want to instanciate.
     *
     * @returns {AbstractGeoviewLayerConfig | undefined} The GeoView layer instance or undefined if there is an error.
     * @static
     */
    static nodeFactory(layerConfig: TypeJsonObject): AbstractGeoviewLayerConfig | undefined;
}
//# sourceMappingURL=map-feature-config.d.ts.map