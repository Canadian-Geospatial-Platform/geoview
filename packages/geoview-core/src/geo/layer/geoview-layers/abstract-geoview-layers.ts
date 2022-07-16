import { generateId } from '../../../core/utils/utilities';
import { api } from '../../../app';
import { TypeLayerEntries } from './schema-types';
import { TypeLangString } from '../../../core/types/global-types';

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

/**
 * Base type used to define GeoView layer config options objects
 */
export type TypeBaseGeoViewLayersConfig = {
  layerType: TypeGeoViewLayers;
  id?: string;
  name?: TypeLangString;
  accessPath: TypeLangString;
  layerEntries: TypeLayerEntries;
};

/** ******************************************************************************************************************************
 * The AbstractGeoViewLayer class is normally used for creating subclasses and is not instantiated (using the new operator) in the
 * app. It registers the configuration options and defines the methods shared by all its descendant. The class constructor has
 * three parameters: mapId, type and layerConfigOptions. Its role is to save in attributes the mapId, type and elements of the
 * layerConfigOptions that are common to all GeoView layers. The main characteristic of a GeoView layer is the presence of an
 * accessPath attribute whose value is passed as an attribute of the layerConfigOptions object.
 */
export abstract class AbstractGeoViewLayer {
  /** The unique identifier of the map on which the GeoView layer will be drawn. */
  protected mapId: string;

  /** The type of GeoView layer that is instantiated. */
  type: TypeGeoViewLayers;

  /** The unique identifier for the GeoView layer. The value of this attribute is extracted from the layerConfigOptions parameter.
   * If its value is undefined, a unique value is generated.
   */
  id: string;

  /** The GeoView layer name. The value of this attribute is extracted from the layerConfigOptions parameter. If its value is
   * undefined, a default value is generated.
   */
  name: string;

  /** The GeoView layer accessPath. The name attribute is optional */
  accessPath: string;

  /** An array of layer settings. */
  layerEntries: TypeLayerEntries;

  /**
   * The class constructor saves parameters and common configuration parameters in attributes.
   *
   * @param {TypeGeoViewLayers} type The type of GeoView layer that is instantiated.
   * @param {TypeBaseGeoViewLayersConfig} layerConfigOptions The GeoView layer configuration options.
   * @param {string} mapId The unique identifier of the map on which the GeoView layer will be drawn.
   */
  constructor(type: TypeGeoViewLayers, layerConfigOptions: TypeBaseGeoViewLayersConfig, mapId: string) {
    this.mapId = mapId;
    this.type = type;
    this.id = layerConfigOptions.id || generateId('');
    this.name = layerConfigOptions.name ? layerConfigOptions.name[api.map(mapId).getLanguageCode()] : DEFAULT_LAYER_NAMES[type];
    this.accessPath = layerConfigOptions.accessPath[api.map(mapId).getLanguageCode()].trim();
    this.layerEntries = layerConfigOptions.layerEntries;
  }
}
