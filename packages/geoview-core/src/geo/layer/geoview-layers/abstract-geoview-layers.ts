import BaseLayer from 'ol/layer/Base';
import Collection from 'ol/Collection';
import LayerGroup, { Options as LayerGroupOptions } from 'ol/layer/Group';

import { generateId } from '../../../core/utils/utilities';
import {
  TypeGeoviewLayerConfig,
  TypeListOfLayerEntryConfig,
  TypeLocalizedString,
  TypeLayerInitialSettings,
  TypeLayerEntryConfig,
} from '../../map/map-schema-types';

/** ******************************************************************************************************************************
 * GeoViewAbstractLayers types
 */

// Constant used to define the default layer names
const DEFAULT_LAYER_NAMES: Record<TypeGeoviewLayerType, string> = {
  esriDynamic: 'Esri Dynamic Layer',
  esriFeature: 'Esri Feature Layer',
  GeoJSON: 'GeoJson Layer',
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
export type TypeGeoviewLayerType = 'esriDynamic' | 'esriFeature' | 'GeoJSON' | 'geoCore' | 'xyzTiles' | 'ogcFeature' | 'ogcWfs' | 'ogcWms';

/**
 * Definition of the GeoView layer constants
 */
export const CONST_LAYER_TYPES: Record<LayerTypesKey, TypeGeoviewLayerType> = {
  ESRI_DYNAMIC: 'esriDynamic',
  ESRI_FEATURE: 'esriFeature',
  GEOJSON: 'GeoJSON',
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
 * metadataAccessPath attribute whose value is passed as an attribute of the mapLayerConfig object.
 */
// ******************************************************************************************************************************
export abstract class AbstractGeoViewLayer {
  /** The unique identifier of the map on which the GeoView layer will be drawn. */
  mapId: string;

  /** The type of GeoView layer that is instantiated. */
  type: TypeGeoviewLayerType;

  /** The unique identifier for the GeoView layer. The value of this attribute is extracted from the mapLayerConfig parameter.
   * If its value is undefined, a unique value is generated.
   */
  layerId: string;

  /** The GeoView layer name. The value of this attribute is extracted from the mapLayerConfig parameter. If its value is
   * undefined, a default value is generated.
   */
  layerName: TypeLocalizedString = { en: '', fr: '' };

  /** The GeoView layer metadataAccessPath. The name attribute is optional */
  metadataAccessPath: TypeLocalizedString = { en: '', fr: '' };

  /**
   * An array of layer settings. In the schema, this attribute is optional. However, we define it as mandatory and if the
   * configuration does not provide a value, we use an empty array instead of an undefined attribute.
   */
  listOfLayerEntryConfig: TypeListOfLayerEntryConfig = [];

  /** Name of listOfLayerEntryConfig that did not load. */
  layerLoadError: string[] = [];

  /**
   * Initial settings to apply to the GeoView layer at creation time.
   * This attribute is allowed only if listOfLayerEntryConfig.length > 1.
   */
  initialSettings?: TypeLayerInitialSettings;

  /**
   * The vector or raster layer structure to be displayed for this GeoView class. Initial value is null indicating that the layers
   * have not been created.
   */
  gvLayers: BaseLayer | null = null;

  /** The layer Identifier that is used to get and set layer's settings. */
  activeLayer: BaseLayer | null = null;

  /** ***************************************************************************************************************************
   * The class constructor saves parameters and common configuration parameters in attributes.
   *
   * @param {TypeGeoviewLayerType} type The type of GeoView layer that is instantiated.
   * @param {TypeGeoviewLayer} mapLayerConfig The GeoView layer configuration options.
   * @param {string} mapId The unique identifier of the map on which the GeoView layer will be drawn.
   */
  constructor(type: TypeGeoviewLayerType, mapLayerConfig: TypeGeoviewLayerConfig, mapId: string) {
    this.mapId = mapId;
    this.type = type;
    this.layerId = mapLayerConfig.layerId || generateId('');
    this.layerName.en = mapLayerConfig?.layerName?.en ? mapLayerConfig.layerName.en : DEFAULT_LAYER_NAMES[type];
    this.layerName.fr = mapLayerConfig?.layerName?.fr ? mapLayerConfig.layerName.fr : DEFAULT_LAYER_NAMES[type];
    if (mapLayerConfig.metadataAccessPath?.en) this.metadataAccessPath.en = mapLayerConfig.metadataAccessPath.en.trim();
    if (mapLayerConfig.metadataAccessPath?.fr) this.metadataAccessPath.fr = mapLayerConfig.metadataAccessPath.fr.trim();
    if (mapLayerConfig.listOfLayerEntryConfig) this.listOfLayerEntryConfig = mapLayerConfig.listOfLayerEntryConfig;
    if (mapLayerConfig.initialSettings) this.initialSettings = mapLayerConfig.initialSettings;
  }

  /** ***************************************************************************************************************************
   * Set the active layer. It is the layer that will be used in some functions when the optional layerId is undefined.
   * When specified and the layerId is not found, the active layer is set to null.
   *
   * @param {string} layerId The layer identifier.
   */
  setActiveLayer(layerId: string) {
    this.activeLayer = this.getBaseLayer(layerId);
  }

  /** ***************************************************************************************************************************
   * Get the layer instance identified by the layerId.
   *
   * @param {string} layerId The layer identifier.
   */
  getBaseLayer(layerId: string, listOfLayerEntryConfig = this.listOfLayerEntryConfig): BaseLayer | null {
    for (let i = 0; i < listOfLayerEntryConfig.length; i++) {
      if (listOfLayerEntryConfig[i].layerId === layerId) return listOfLayerEntryConfig[i].gvlayer!;
      if (listOfLayerEntryConfig[i].entryType === 'group') {
        const gvLayer = this.getBaseLayer(layerId, listOfLayerEntryConfig[i].listOfLayerEntryConfig);
        if (gvLayer) return gvLayer;
      }
    }
    return null;
  }

  /** ***************************************************************************************************************************
   * This method create a layer group. it uses the layer initial settings of the GeoView layer configuration.
   *
   * @returns {LayerGroup} A new layer group.
   */
  protected createLayerGroup(layerEntryConfig: TypeLayerEntryConfig): LayerGroup {
    const layerGroupOptions: LayerGroupOptions = {
      layers: new Collection(),
      properties: { layerEntryConfig },
    };
    if (this.initialSettings?.extent !== undefined) layerGroupOptions.extent = this.initialSettings?.extent;
    if (this.initialSettings?.maxZoom !== undefined) layerGroupOptions.maxZoom = this.initialSettings?.maxZoom;
    if (this.initialSettings?.minZoom !== undefined) layerGroupOptions.minZoom = this.initialSettings?.minZoom;
    if (this.initialSettings?.opacity !== undefined) layerGroupOptions.opacity = this.initialSettings?.opacity;
    if (this.initialSettings?.visible !== undefined) layerGroupOptions.visible = this.initialSettings?.visible;
    // eslint-disable-next-line no-param-reassign
    layerEntryConfig.gvlayer = new LayerGroup(layerGroupOptions);
    return layerEntryConfig.gvlayer as LayerGroup;
  }
}
