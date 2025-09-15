import { TypeAppBarProps, TypeDisplayTheme, TypeFooterBarProps, TypeGlobalSettings, TypeMapConfig, TypeCorePackagesConfig, TypeOverviewMapProps, TypeServiceUrls, TypeMapFeaturesInstance, TypeValidMapCorePackageProps, TypeValidMapComponentProps, TypeValidNavBarProps, TypeExternalPackagesProps, TypeValidVersions } from '@/api/types/map-schema-types';
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
    navBar?: TypeValidNavBarProps[];
    /** Footer bar properies. */
    footerBar?: TypeFooterBarProps;
    /** App bar properies. */
    appBar?: TypeAppBarProps;
    /** Overview map properies. */
    overviewMap?: TypeOverviewMapProps;
    /** Map components. */
    components?: TypeValidMapComponentProps[];
    /** List of core packages. */
    corePackages?: TypeValidMapCorePackageProps[];
    /** List of core packages config. */
    corePackagesConfig?: TypeCorePackagesConfig;
    /** List of external packages. */
    externalPackages?: TypeExternalPackagesProps[];
    /** Global map settings */
    globalSettings: TypeGlobalSettings;
    /** Service URLs. */
    serviceUrls: TypeServiceUrls;
    /**
     * The schema version used to validate the configuration file. The schema should enumerate the list of versions accepted by
     * this version of the viewer.
     */
    schemaVersionUsed?: TypeValidVersions;
    /**
     * The class constructor
     *
     * All properties at this inheritance level have no values provided in the metadata. They are therefore initialized
     * from the configuration passed as a parameter or from the default values.
     *
     * @param {TypeMapFeaturesInstance} userMapFeatureConfig - The map feature configuration to instantiate.
     * @constructor
     */
    constructor(userMapFeatureConfig: TypeMapFeaturesInstance);
}
//# sourceMappingURL=map-feature-config.d.ts.map