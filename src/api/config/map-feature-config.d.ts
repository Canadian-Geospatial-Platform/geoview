import type { TypeAppBarProps, TypeDisplayTheme, TypeFooterBarProps, TypeGlobalSettings, TypeMapConfig, TypeCorePackagesConfig, TypeOverviewMapProps, TypeServiceUrls, TypeMapFeaturesInstance, TypeValidMapCorePackageProps, TypeValidMapComponentProps, TypeValidNavBarProps, TypeExternalPackagesProps, TypeValidVersions } from '@/api/types/map-schema-types';
/**
 * The map feature configuration class.
 */
export declare class MapFeatureConfig {
    #private;
    /** Map configuration. */
    map: TypeMapConfig;
    /** Display theme, default = geo.ca. */
    theme?: TypeDisplayTheme;
    /** Nav bar properties. */
    navBar?: TypeValidNavBarProps[];
    /** Footer bar properties. */
    footerBar?: TypeFooterBarProps;
    /** App bar properties. */
    appBar?: TypeAppBarProps;
    /** Overview map properties. */
    overviewMap?: TypeOverviewMapProps;
    /** Map components. */
    components?: TypeValidMapComponentProps[];
    /** List of core packages. */
    corePackages?: TypeValidMapCorePackageProps[];
    /** List of core packages config. */
    corePackagesConfig?: TypeCorePackagesConfig;
    /** List of external packages. */
    externalPackages?: TypeExternalPackagesProps[];
    /** Global map settings. */
    globalSettings: TypeGlobalSettings;
    /** Service URLs. */
    serviceUrls: TypeServiceUrls;
    /**
     * The schema version used to validate the configuration file. The schema should enumerate the list of versions accepted by
     * this version of the viewer.
     */
    schemaVersionUsed?: TypeValidVersions;
    /**
     * Creates an instance of MapFeatureConfig.
     *
     * All properties at this inheritance level have no values provided in the metadata. They are therefore initialized
     * from the configuration passed as a parameter or from the default values.
     *
     * @param userMapFeatureConfig - The map feature configuration to instantiate
     */
    constructor(userMapFeatureConfig: TypeMapFeaturesInstance);
}
//# sourceMappingURL=map-feature-config.d.ts.map