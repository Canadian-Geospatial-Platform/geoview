import { logger } from '../../../../logger';
import { generateId } from '../../../../utilities';
import { Cast, TypeGeoviewLayerType, TypeJsonArray, TypeJsonObject } from '../../config-types';
import { ConfigBaseClass } from '../layer-tree-config/config-base-class';
import { TypeLayerInitialSettings, TypeLocalizedString } from '../../map-schema-types';
import { layerEntryIsGroupLayer } from '../../type-guards';
import { GroupLayerEntryConfig } from '../layer-tree-config/group-layer-entry-config';

/** ******************************************************************************************************************************
 *  Definition of a single Geoview layer configuration.
 */
export abstract class AbstractGeoviewLayerConfig {
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
    this.initialSettings = Cast<TypeLayerInitialSettings>(layerConfig.initialSettings);
    this.createListOfLayerEntryConfig((layerConfig.listOfLayerEntryConfig || []) as TypeJsonArray);

    if (!layerConfig.geoviewLayerName)
      logger.logError(`Property geoviewLayerName is mandatory for GeoView layer ${this.geoviewLayerId} of type ${this.geoviewLayerType}.`);
    if (!layerConfig.geoviewLayerType)
      logger.logError(`Property geoviewLayerType is mandatory for GeoView layer ${this.geoviewLayerId} of type ${this.geoviewLayerType}.`);
  }

  createListOfLayerEntryConfig(listOfJsonLayerConfig: TypeJsonArray): void {
    this.listOfLayerEntryConfig = listOfJsonLayerConfig.map((jsonLayerConfig) => {
      if (layerEntryIsGroupLayer(jsonLayerConfig)) {
        return new GroupLayerEntryConfig(jsonLayerConfig, this.initialSettings, this);
      }
      return this.createLeafNode(jsonLayerConfig, this.initialSettings, this)!;
    });
  }

  abstract createLeafNode(
    layerConfig: TypeJsonObject,
    initialSettings: TypeLayerInitialSettings,
    geoviewConfig: AbstractGeoviewLayerConfig
  ): ConfigBaseClass | undefined;
}
