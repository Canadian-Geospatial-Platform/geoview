import LayerGroup from 'ol/layer/Group';
import BaseLayer from 'ol/layer/Base';
import { TypeGeoviewLayerType } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import {
  ConfigBaseClass,
  TypeLayerEntryType,
  TypeLayerInitialSettings,
  TypeListOfLayerEntryConfig,
  TypeLocalizedString,
  TypeSourceGeocoreConfig,
  layerEntryIsGroupLayer,
} from '@/geo/map/map-schema-types';
import { logger } from '../../logger';

/** ******************************************************************************************************************************
 * Type used to define a GeoView layer where configration is extracted by a configuration snippet stored on a server. The server
 * configuration will handle bilangual informations.
 */
export class GeoCoreLayerEntryConfig extends ConfigBaseClass {
  /** This attribute from ConfigBaseClass is not used by groups. */
  declare isMetadataLayerGroup: never;

  /** Tag used to link the entry to a specific schema. */
  schemaTag = 'geoCore' as TypeGeoviewLayerType;

  /** Layer entry data type. */
  entryType = 'geoCore' as TypeLayerEntryType;

  /** The layerIdExtension is not used by geocore layers. */
  declare layerIdExtension: never;

  /** The display name of a geocore layer is in geocoreLayerName. */
  declare layerName: never;

  /** The display name of the layer (English/French). */
  geocoreLayerName?: TypeLocalizedString;

  /** The access path to the geoCore endpoint (optional, this value should be embeded in the GeoView API). */
  source?: TypeSourceGeocoreConfig;

  /**
   * Initial settings to apply to the GeoView layer entry at creation time. Initial settings are inherited from the parent in the
   * configuration tree.
   */
  initialSettings?: TypeLayerInitialSettings;

  /** The list of layer entry configurations to use from the Geocore layer. */
  listOfLayerEntryConfig?: TypeListOfLayerEntryConfig;

  /**
   * The class constructor.
   * @param {GeoCoreLayerEntryConfig} layerConfig The layer configuration we want to instanciate.
   */
  constructor(layerConfig: GeoCoreLayerEntryConfig) {
    super(layerConfig);
    Object.assign(this, layerConfig);
  }

  /**
   * The olLayer getter method for the ConfigBaseClass class and its descendant classes.
   * All layerConfig has an olLayer property, but the olLayer setter can only be use on group layers.
   */
  get olLayer() {
    // eslint-disable-next-line no-underscore-dangle
    return this._olLayer;
  }

  /**
   * The olLayer setter method for the ConfigBaseClass class and its descendant classes.
   * All layerConfig has an olLayer property, but the olLayer setter can only be use on group layers.
   * If you want to set the olLayer property for a descendant of AbstractBaseLayerEntryConfig, you must
   * use its olLayerAndLoadEndListeners because it enforce the creation of the load end listeners.
   * @param {LayerGroup} olLayerValue The new olLayerd value.
   */
  set olLayer(olLayerValue: BaseLayer | LayerGroup | null) {
    // eslint-disable-next-line no-underscore-dangle
    if (layerEntryIsGroupLayer(this)) this._olLayer = olLayerValue;
    else logger.logError(`The olLayer setter can only be used on layer group and layerPath refers to a layer of type "${this.entryType}".`);
  }
}
