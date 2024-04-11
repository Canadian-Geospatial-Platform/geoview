import { logger } from '../../../../logger';
import { generateId } from '../../../../utilities';
import { CONST_LAYER_TYPES } from '../../config-constants';
import { Cast, TypeGeoviewLayerType, TypeJsonArray, TypeJsonObject } from '../../config-types';
import { ConfigBaseClass } from '../layer-tree-config/config-base-class';
import { TypeLayerInitialSettings, TypeLocalizedString } from '../../map-schema-types';
import { EsriDynamicLayerConfig } from './raster-config/esri-dynamic-config';
import { layerEntryIsGroupLayer } from '../../type-guards';
import { GroupLayerEntryConfig } from '../layer-tree-config/group-layer-entry-config';
import { EsriFeatureLayerConfig } from './vector-config/esri-feature-config';

/** ******************************************************************************************************************************
 *  Definition of a single Geoview layer configuration.
 */
export class AbstractGeoviewLayerConfig {
  /** The GeoView layer identifier. */
  geoviewLayerId: string;

  /**
   * The display name of the layer (English/French). If it is not present the viewer will make an attempt to scrape this
   * information.
   */
  geoviewLayerName: TypeLocalizedString;

  /** The GeoView layer access path (English/French). */
  metadataAccessPath: TypeLocalizedString;

  /** Type of GeoView layer. */
  geoviewLayerType: TypeGeoviewLayerType;

  /** Date format used by the service endpoint. */
  serviceDateFormat: string | undefined;

  /** Date format used by the getFeatureInfo to output date variable. */
  externalDateFormat: string | undefined;

  /**
   * Initial settings to apply to the GeoView layer at creation time.
   * This attribute is allowed only if listOfLayerEntryConfig.length > 1.
   */
  initialSettings: TypeLayerInitialSettings;

  /** The layer entries to use from the GeoView layer. */
  listOfLayerEntryConfig: ConfigBaseClass[] = [];

  /**
   * The class constructor.
   * @param {TypeJsonObject} layerConfig The layer configuration we want to instanciate.
   */
  constructor(layerConfig: TypeJsonObject) {
    this.geoviewLayerId = (layerConfig.geoviewLayerId || generateId()) as string;
    this.geoviewLayerName = Cast<TypeLocalizedString>(layerConfig.geoviewLayerName);
    this.metadataAccessPath = Cast<TypeLocalizedString>(layerConfig.metadataAccessPath);
    this.geoviewLayerType = Cast<TypeGeoviewLayerType>(layerConfig.geoviewLayerType);
    this.serviceDateFormat = (layerConfig.geoviewLayerId || 'DD/MM/YYYY HH:MM:SSZ') as string;
    this.externalDateFormat = (layerConfig.externalDateFormat || 'DD/MM/YYYY HH:MM:SSZ') as string;
    // TODO: Default values must be defined for the initialSettings property.
    this.initialSettings = Cast<TypeLayerInitialSettings>(layerConfig.initialSettings);
    this.createListOfLayerEntryConfig((layerConfig.listOfLayerEntryConfig || []) as TypeJsonArray);

    if (!layerConfig.geoviewLayerName)
      logger.logError(`Property geoviewLayerName is mandatory for GeoView layer ${this.geoviewLayerId} of type ${this.geoviewLayerType}.`);
    if (!layerConfig.geoviewLayerType)
      logger.logError(`Property geoviewLayerType is mandatory for GeoView layer ${this.geoviewLayerId} of type ${this.geoviewLayerType}.`);
  }

  createListOfLayerEntryConfig(listOfJsonLayerConfig: TypeJsonArray) {
    this.listOfLayerEntryConfig = listOfJsonLayerConfig.map((jsonLayerConfig) => {
      if (layerEntryIsGroupLayer(jsonLayerConfig)) {
        return new GroupLayerEntryConfig(jsonLayerConfig, this.initialSettings, this);
      }
      return this.createLeafNode(jsonLayerConfig, this.initialSettings, this)!;
    });
  }

  createLeafNode(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    layerConfig: TypeJsonObject,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    initialSettings: TypeLayerInitialSettings,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    geoviewConfig: AbstractGeoviewLayerConfig
  ): ConfigBaseClass | undefined {
    return undefined;
  }

  static nodeFactory(nodeConfig: TypeJsonObject): AbstractGeoviewLayerConfig | undefined {
    switch (nodeConfig.geoviewLayerType) {
      // case CONST_LAYER_TYPES.CSV:
      //   return new CsvLayerConfig(nodeConfig);
      case CONST_LAYER_TYPES.ESRI_DYNAMIC:
        return new EsriDynamicLayerConfig(nodeConfig);
      case CONST_LAYER_TYPES.ESRI_FEATURE:
        return new EsriFeatureLayerConfig(nodeConfig);
      // case CONST_LAYER_TYPES.ESRI_IMAGE:
      //   return new EsriImageLayerConfig(nodeConfig);
      // case CONST_LAYER_TYPES.GEOJSON:
      //   return new GeojsonLayerConfig(nodeConfig);
      // case CONST_LAYER_TYPES.GEOPACKAGE:
      //   return new GeopackageLayerConfig(nodeConfig);
      // case CONST_LAYER_TYPES.XYZ_TILES:
      //   return new XyzLayerConfig(nodeConfig);
      // case CONST_LAYER_TYPES.VECTOR_TILES:
      //   return new VectorTileLayerConfig(nodeConfig);
      // case CONST_LAYER_TYPES.OGC_FEATURE:
      //   return new OgcFeatureLayerConfig(nodeConfig);
      // case CONST_LAYER_TYPES.WFS:
      //   return new WfsLayerConfig(nodeConfig);
      // case CONST_LAYER_TYPES.WMS:
      //   return new WmsLayerConfig(nodeConfig);
      default:
        logger.logError(`Invalid GeoView layerType (${nodeConfig.asd}).`);
    }
    return undefined;
  }
}
