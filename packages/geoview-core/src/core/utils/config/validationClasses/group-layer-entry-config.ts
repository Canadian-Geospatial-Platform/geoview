import BaseLayer from 'ol/layer/Base';
import LayerGroup from 'ol/layer/Group';
import {
  ConfigBaseClass,
  TypeLayerEntryType,
  TypeLayerInitialSettings,
  TypeListOfLayerEntryConfig,
  TypeLocalizedString,
  layerEntryIsGroupLayer,
} from '@/geo/map/map-schema-types';
import { logger } from '../../logger';

/** ******************************************************************************************************************************
 * Type used to define a layer group.
 */
export class GroupLayerEntryConfig extends ConfigBaseClass {
  /** Tag used to link the entry to a specific schema is not used by groups. */
  declare schemaTag: never;

  /** Layer entry data type. */
  entryType = 'group' as TypeLayerEntryType;

  /** The ending element of the layer configuration path is not used on groups. */
  declare layerIdExtension: never;

  /** The display name of the layer (English/French). */
  layerName?: TypeLocalizedString;

  /**
   * Initial settings to apply to the GeoView layer entry at creation time. Initial settings are inherited from the parent in the
   * configuration tree.
   */
  initialSettings?: TypeLayerInitialSettings;

  /** Source settings to apply to the GeoView vector layer source at creation time is not used by groups. */
  declare source: never;

  /** The list of layer entry configurations to use from the GeoView layer group. */
  listOfLayerEntryConfig: TypeListOfLayerEntryConfig = [];

  /**
   * The class constructor.
   * @param {GroupLayerEntryConfig} layerConfig The layer configuration we want to instanciate.
   */
  constructor(layerConfig: GroupLayerEntryConfig) {
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
    const { entryType } = this;
    // eslint-disable-next-line no-underscore-dangle
    if (layerEntryIsGroupLayer(this)) this._olLayer = olLayerValue;
    else logger.logError(`The olLayer setter can only be used on layer group and layerPath refers to a layer of type "${entryType}".`);
  }
}
