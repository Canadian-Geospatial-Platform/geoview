import { generateId } from '../../../core/utils/utilities';
import { TypeArrayOfLayerConfig } from './schema-types';
import { TypeLangString } from '../../../core/types/global-types';
import { TypeGeoviewLayerConfig } from '../../map/map-types';

/** ******************************************************************************************************************************
 * GeoViewAbstractLayers types
 */

// Constant used to define the default layer names
const DEFAULT_LAYER_NAMES: Record<TypeGeoViewLayers, string> = {
  esriDynamic: 'Esri Dynamic Layer',
  esriFeature: 'Esri Feature Layer',
  geojson: 'GeoJson Layer',
  geoCore: 'GeoCore Layer',
  xyzTiles: 'XYZ Tiles',
  ogcFeature: 'OGC Feature Layer',
  ogcWfs: 'WFS Layer',
  ogcWms: 'WMS Layer',
};

// Definition of the keys used to create the constants of the GeoView layer
type LayerTypesKey = 'ESRI_DYNAMIC' | 'ESRI_FEATURE' | 'GEOJSON' | 'GEOCORE' | 'XYZ_TILES' | 'OGC_FEATURE' | 'WFS' | 'WMS';

/**
 * Type of GeoView layers
 */
export type TypeGeoViewLayers = 'esriDynamic' | 'esriFeature' | 'geojson' | 'geoCore' | 'xyzTiles' | 'ogcFeature' | 'ogcWfs' | 'ogcWms';

/**
 * Definition of the GeoView layer constants
 */
export const CONST_LAYER_TYPES: Record<LayerTypesKey, TypeGeoViewLayers> = {
  ESRI_DYNAMIC: 'esriDynamic',
  ESRI_FEATURE: 'esriFeature',
  GEOJSON: 'geojson',
  GEOCORE: 'geoCore',
  XYZ_TILES: 'xyzTiles',
  OGC_FEATURE: 'ogcFeature',
  WFS: 'ogcWfs',
  WMS: 'ogcWms',
};

// ******************************************************************************************************************************
// ******************************************************************************************************************************
/** ******************************************************************************************************************************
 * The AbstractGeoViewLayer class is normally used for creating subclasses and is not instantiated (using the new operator) in the
 * app. It registers the configuration options and defines the methods shared by all its descendant. The class constructor has
 * three parameters: mapId, type and mapLayerConfig. Its role is to save in attributes the mapId, type and elements of the
 * mapLayerConfig that are common to all GeoView layers. The main characteristic of a GeoView layer is the presence of an
 * accessPath attribute whose value is passed as an attribute of the mapLayerConfig object.
 */
// ******************************************************************************************************************************
export abstract class AbstractGeoViewLayer {
  /** The unique identifier of the map on which the GeoView layer will be drawn. */
  protected mapId: string;

  /** The type of GeoView layer that is instantiated. */
  type: TypeGeoViewLayers;

  /** The unique identifier for the GeoView layer. The value of this attribute is extracted from the mapLayerConfig parameter.
   * If its value is undefined, a unique value is generated.
   */
  id: string;

  /** The GeoView layer name. The value of this attribute is extracted from the mapLayerConfig parameter. If its value is
   * undefined, a default value is generated.
   */
  name: TypeLangString = { en: '', fr: '' };

  /** The GeoView layer accessPath. The name attribute is optional */
  accessPath: TypeLangString = { en: '', fr: '' };

  /**
   * An array of layer settings. In the schema, this attribute is optional. However, we define it as mandatory and if the
   * configuration does not provide a value, we use an empty array instead of an undefined attribute.
   */
  layerEntries: TypeArrayOfLayerConfig = [];

  /**
   * The class constructor saves parameters and common configuration parameters in attributes.
   *
   * @param {TypeGeoViewLayers} type The type of GeoView layer that is instantiated.
   * @param {TypeGeoviewLayer} mapLayerConfig The GeoView layer configuration options.
   * @param {string} mapId The unique identifier of the map on which the GeoView layer will be drawn.
   */
  constructor(type: TypeGeoViewLayers, mapLayerConfig: TypeGeoviewLayerConfig, mapId: string) {
    this.mapId = mapId;
    this.type = type;
    this.id = mapLayerConfig.id || generateId('');
    this.name.en = mapLayerConfig.name && mapLayerConfig.name.en ? mapLayerConfig.name.en : DEFAULT_LAYER_NAMES[type];
    this.name.fr = mapLayerConfig.name && mapLayerConfig.name.fr ? mapLayerConfig.name.en : DEFAULT_LAYER_NAMES[type];
    this.accessPath.en = mapLayerConfig.accessPath.en.trim();
    this.accessPath.fr = mapLayerConfig.accessPath.fr.trim();
    if (typeof mapLayerConfig.layerEntries !== 'undefined') this.layerEntries = mapLayerConfig.layerEntries;
  }
}
