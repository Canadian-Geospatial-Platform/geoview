import { TypeLangString } from '../../core/types/global-types';
import { TypeBasemapOptions } from '../layer/basemap/basemap-types';
import { TypeGeoViewLayers } from '../layer/geoview-layers/abstract-geoview-layers';
import { TypeLayerEntries } from '../layer/geoview-layers/schema-types';

/** ******************************************************************************************************************************
 *  Definition of the map properties type according to what is specified in the schema.
 */
export type TypeMapSchemaProps = {
  /** Map configuration */
  map: TypeMapConfig;
  /** Display theme, default = dark. */
  theme?: 'dark' | 'light';
  /** App bar properties. */
  appBar?: TypeAppBarProps;
  /** Nav bar properies. */
  navBar?: TypeNavBarProps;
  /** North arrow properties. */
  // northArrow?: TypeNorthArrowProps; // ! Not defined in the schema
  /** Map components. */
  components?: TypeMapComponents;
  /** List of core packages. */
  corePackages?: TypeMapCorePackages;
  /** List of external packages. */
  externalPackages?: TypeExternalPackages;
  /** Service URLs. */
  serviceUrls?: TypeServiceUrls;
  /** Display Languages. */
  languages: TypeLanguages[];
  /**
   * The schema version used to validate the configuration file. The schema should enumerate the list of versions accepted by
   * this version of the viewer.
   */
  version: '1.0' | '2.0';
};

/** ******************************************************************************************************************************
 *  Definition of the map configuration settings.
 1 * /
export type TypeMapConfig = {
  /** Basemap options settings for this map configuration. 1 * /
  basemapOptions: TypeBasemapOptions;
  /** Type of interaction. 1 * /
  interaction: TypeInteraction;
  /** Layers list in the order which they should be added to the map. 1 * /
  layers?: TypeLayerEntries;
  /** View settings. 1 * /
  view: TypeViewSettings;
  /** Additional options used for OpenLayers map options. 1 * /
  extraOptions?: Record<string, unknown>;
};

/** ******************************************************************************************************************************
 *  Definition of the map configuration settings.
 */
export type TypeMapConfig = {
  /** Basemap options settings for this map configuration. */
  basemapOptions: TypeBasemapOptions;
  /** Type of interaction. */
  interaction: TypeInteraction;
  /** Layers list in the order which they should be added to the map. */
  layers?: TypeMapLayer[];
  /** View settings. */
  view: TypeViewSettings;
  /** Additional options used for OpenLayers map options. */
  extraOptions?: Record<string, unknown>;
};

export type TypeMapLayer = {
  id: string;
  name: TypeLangString;
  accessPath: TypeLangString;
  layerType: TypeGeoViewLayers;
  layerEntries: TypeLayerEntries;
};

/** ******************************************************************************************************************************
 *  Definition of the valid map interactiom valuess.
 */
export type TypeInteraction = 'static' | 'dynamic';

/** ******************************************************************************************************************************
 *  Definition of the view settings.
 */
export type TypeViewSettings = {
  /**
   * Center of the map defined as [longitude, latitude]. Longitude domaine = [-160..160], default = -106.
   * Latitude domaine = [-80..80], default = 60. */
  center: [number, number];
  /** Enable rotation. If false, a rotation constraint that always sets the rotation to zero is used. Default = true. */
  enableRotation?: boolean;
  /**
   * The initial rotation for the view in degree (positive rotation clockwise, 0 means North). Will be converted to radiant by
   * the viewer. Domaine = [0..360], default = 0.
   */
  rotation?: number;
  /** The extent that constrains the view. Called with [minX, minY, maxX, maxY] extent coordinates. */
  extent?: [number, number, number, number];
  /**
   * The minimum zoom level used to determine the resolution constraint. If not set, will use default from basemap.
   * Domaine = [0..50].
   */
  minZoom?: number;
  /**
   * The maximum zoom level used to determine the resolution constraint. If not set, will use default from basemap.
   * Domaine = [0..50].
   */
  maxZoom?: number;
  /**
   * Spatial Reference EPSG code supported (https://epsg.io/). We support Web Mercator and Lambert Conical Conform Canada.
   * Default = 3978.
   */
  projection: TypeValidProjectionCodes;
  /** Initial map zoom level. Zoom level are define by the basemap zoom levels. Domaine = [0..28], default = 12. */
  zoom: number;
};

/** ******************************************************************************************************************************
 *  Type used to define valid projection codes.
 */
export type TypeValidProjectionCodes = 3978 | 3857;

/** ******************************************************************************************************************************
 *  Definition of the app bar properties.
 */
export type TypeAppBarProps = {
  /**
   * The content of the about section in Markdown format. If empty, it will be ignored. If not, it will create a button
   * on the appbar to open the panel. In the basic view, this information may be added in a container above the map.
   */
  about: TypeLangString;
};

/** ******************************************************************************************************************************
 * Controls availalbe on the navigation bar. Default = ['zoom', 'fullscreen', 'fullextent'].
 */
export type TypeNavBarProps = Array<'zoom' | 'fullscreen' | 'fullextent'>;

/** ******************************************************************************************************************************
 * Core components to initialize on viewer load. Default = ['appbar', 'navbar', 'northArrow', 'overviewMap'].
 */
export type TypeMapComponents = Array<'appbar' | 'navbar' | 'northArrow' | 'overviewMap'>;

/** ******************************************************************************************************************************
 * Core packages to initialize on viewer load. The schema for those are on their own package. NOTE: config from packages are in
 * the same loaction as core config (<<core config name>>-<<package name>>.json).
 * Default = ['basemap-panel' | 'layers-panel' | 'details-panel' | 'geolocator-panel'].
 */
export type TypeMapCorePackages = Array<'basemap-panel' | 'layers-panel' | 'details-panel' | 'geolocator-panel'>;

/** ******************************************************************************************************************************
 * List of external packages to initialize on viewer load. Default = [].
 */
export type TypeExternalPackages = {
  /** External Package name. The name must be ideintical to the window external package object to load. */
  name: string;
  /**
   * The url to the external package configuration setting. The core package will read the configuration and pass it inside
   * the package.
   */
  configUrl?: string;
}[];

/** ******************************************************************************************************************************
 * Service endpoint urls. Default = 'https://geocore.api.geo.ca'.
 */
export type TypeServiceUrls = {
  /**
   * Service end point to access API for layers specification (loading and plugins parameters). By default it is GeoCore but can
   * be another endpoint with similar output.
   */
  keys: string;
  /**
   * An optional proxy to be used for dealing with same-origin issues.  URL must either be a relative path on the same server
   * or an absolute path on a server which sets CORS headers.
   */
  proxyUrl: string;
};

/** ******************************************************************************************************************************
 * ISO 639-1 code indicating the languages supported by the configuration file. It will use value(s) provided here to access
 * bilangual nodes. For value(s) provided here, each bilingual node MUST provide a value.
 */
export type TypeLanguages = 'en' | 'fr';
export type TypeLocalizedLanguages = 'en-CA' | 'fr-CA';
