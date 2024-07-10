import { AbstractGeoviewLayerConfig } from '@config/types/classes/geoview-config/abstract-geoview-layer-config';
import { TypeJsonObject } from '@config/types/config-types';
import { TypeAppBarProps, TypeDisplayLanguage, TypeDisplayTheme, TypeExternalPackages, TypeFooterBarProps, TypeMapComponents, TypeMapConfig, TypeMapCorePackages, TypeNavBarProps, TypeOverviewMapProps, TypeServiceUrls } from '@config/types/map-schema-types';
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
    /** List of external packages. */
    externalPackages?: TypeExternalPackages;
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
     * A copy of the original configuration is kept to identify which fields were left empty by the user. This information will be
     * useful after reading the metadata to determine whether a default value should be applied.
     *
     * @param {TypeJsonObject} providedMapConfig The map feature configuration to instantiate.
     * @param {TypeDisplayLanguage} language The initial language to use when interacting with the map feature configuration.
     * @constructor
     */
    constructor(providedMapFeatureConfig: TypeJsonObject, language: TypeDisplayLanguage);
    /**
     * This method reads the service metadata for geoview layers in the geoview layer list.
     */
    fetchAllServiceMetadata(): Promise<void>;
    /**
     * The getter method that returns the errorDetected flag.
     *
     * @returns {boolean} The errorDetected property associated to the map feature config.
     */
    get errorDetected(): boolean;
    /**
     * This method returns the json string of the map feature's configuration. The output representation is a multi-line indented
     * string. Indentation can be controled using the ident parameter. Private variables and pseudo-properties are not serialized.
     * @param {number} indent The number of space to indent the output string (default=2).
     *
     * @returns {string} The json string corresponding to the map feature configuration.
     */
    serialize(indent?: number): string;
    /**
     * Methode used to set the MapFeatureConfig error flag to true.
     */
    setErrorDetectedFlag(): void;
    /**
     * The method used to implement the class factory model that returns the instance of the class based on the GeoView layer type
     * needed.
     *
     * @param {TypeJsonObject} layerConfig The layer configuration we want to instanciate.
     * @param {TypeDisplayLanguage} language The initial language to use when interacting with the map feature configuration.
     * @param {MapFeatureConfig} mapFeatureConfig An optional mapFeatureConfig instance if the layer is part of it.
     *
     * @returns {AbstractGeoviewLayerConfig | undefined} The GeoView layer instance or undefined if there is an error.
     * @static
     */
    static nodeFactory(layerConfig: TypeJsonObject, language: TypeDisplayLanguage, mapFeatureConfig?: MapFeatureConfig): AbstractGeoviewLayerConfig | undefined;
}
