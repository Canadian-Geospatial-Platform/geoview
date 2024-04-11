import {
  TypeAppBarProps,
  TypeDisplayLanguage,
  TypeDisplayTheme,
  TypeExternalPackages,
  TypeFooterBarProps,
  TypeListOfLocalizedLanguages,
  TypeMapComponents,
  TypeMapConfig,
  TypeMapCorePackages,
  TypeNavBarProps,
  TypeOverviewMapProps,
  TypeServiceUrls,
} from '../map-schema-types';
import { AbstractGeoviewLayerConfig } from './geoview-config/abstract-geoview-layer-config';
import { Cast, TypeJsonArray, TypeJsonObject } from '../config-types';

/** ******************************************************************************************************************************
 *  Definition of the map feature instance according to what is specified in the schema.
 */
export class MapFeaturesConfig {
  /** This attribute is not part of the schema. It is placed here to keep the 'id' attribute of the HTML div of the map. */
  #mapId?: string;

  /** This attribute is not part of the schema. It is placed here to keep the 'data-lang' attribute of the HTML div of the map. */
  #displayLanguage?: TypeDisplayLanguage;

  /** If true, the ready callback 'cgpv.init(mapId)' is called with the mapId as a parameter when the map is ready */
  triggerReadyCallback?: boolean;

  /** map configuration. */
  map: TypeMapConfig;

  /** Service URLs. */
  serviceUrls: TypeServiceUrls;

  /** Display theme, default = geo.ca. */
  theme?: TypeDisplayTheme;

  /** Nav bar properies. */
  navBar?: TypeNavBarProps;

  /** App bar properies. */
  appBar?: TypeAppBarProps;

  /** Footer bar properies. */
  footerBar?: TypeFooterBarProps;

  /** Overview map properies. */
  overviewMap?: TypeOverviewMapProps;

  /** Map components. */
  components?: TypeMapComponents;

  /** List of core packages. */
  corePackages?: TypeMapCorePackages;

  /** List of external packages. */
  externalPackages?: TypeExternalPackages;

  /**
   * ISO 639-1 code indicating the languages supported by the configuration file. It will use value(s) provided here to
   * access bilangual configuration nodes. For value(s) provided here, each bilingual configuration node MUST provide a value.
   * */
  suportedLanguages: TypeListOfLocalizedLanguages;

  /**
   * The schema version used to validate the configuration file. The schema should enumerate the list of versions accepted by
   * this version of the viewer.
   */
  schemaVersionUsed?: '1.0';

  /**
   * The class constructor.
   * @param {TypeJsonObject} layerConfig The map configuration we want to instanciate.
   */
  constructor(layerConfig: TypeJsonObject) {
    this.#mapId = layerConfig.mapId as string;
    this.#displayLanguage = layerConfig.displayLanguage as TypeDisplayLanguage;
    this.triggerReadyCallback = layerConfig.triggerReadyCallback as boolean;
    const mapConfig = Cast<TypeMapConfig>(layerConfig.map);
    this.map = {
      basemapOptions: { ...mapConfig.basemapOptions },
      interaction: mapConfig.interaction,
      viewSettings: { ...mapConfig.viewSettings },
      highlightColor: mapConfig.highlightColor,
      extraOptions: { ...mapConfig.extraOptions },
      listOfGeoviewLayerConfig: [],
    };
    /** List of GeoView Layers in the order which they should be added to the map. */
    this.map.listOfGeoviewLayerConfig = Cast<AbstractGeoviewLayerConfig[]>(
      ((layerConfig.map as TypeJsonObject).listOfGeoviewLayerConfig as TypeJsonArray)?.filter((geoviewConfig) => {
        return AbstractGeoviewLayerConfig.nodeFactory(geoviewConfig);
      })
    );

    this.serviceUrls = { ...Cast<TypeServiceUrls>(layerConfig.serviceUrls) };
    this.theme = layerConfig.theme as TypeDisplayTheme;
    this.navBar = [...Cast<TypeNavBarProps>(layerConfig.navBar)];
    this.appBar = { ...Cast<TypeAppBarProps>(layerConfig.appBar) };
    this.footerBar = { ...Cast<TypeFooterBarProps>(layerConfig.footerBar) };
    this.overviewMap = { ...Cast<TypeOverviewMapProps>(layerConfig.overviewMap) };
    this.components = [...Cast<TypeMapComponents>(layerConfig.components)];
    this.corePackages = [...Cast<TypeMapCorePackages>(layerConfig.corePackages)];
    this.externalPackages = { ...Cast<TypeExternalPackages>(layerConfig.externalPackages) };
    this.suportedLanguages = { ...Cast<TypeListOfLocalizedLanguages>(layerConfig.suportedLanguages) };
    if (layerConfig.schemaVersionUsed && layerConfig.schemaVersionUsed !== '1.0')
      throw new Error(`Invalid configuration version number (${layerConfig.schemaVersionUsed})`);
    this.schemaVersionUsed = '1.0';
  }

  get mapId(): string | undefined {
    return this.#mapId;
  }

  set mapId(newValue: string | undefined) {
    this.#mapId = newValue;
  }

  get displayLanguage(): TypeDisplayLanguage | undefined {
    return this.#displayLanguage;
  }

  set displayLanguage(newValue: TypeDisplayLanguage | undefined) {
    this.#displayLanguage = newValue;
  }
}
