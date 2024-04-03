import BaseLayer from 'ol/layer/Base';
import LayerGroup from 'ol/layer/Group';
import {
  CONST_LAYER_ENTRY_TYPES,
  TypeLayerInitialSettings,
  TypeListOfLayerEntryConfig,
  layerEntryIsGroupLayer,
} from '@/geo/map/map-schema-types';
import { logger } from '@/core/utils/logger';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';

/** ******************************************************************************************************************************
 * Type used to define a layer group.
 */
export class GroupLayerEntryConfig extends ConfigBaseClass {
  /** Layer entry data type. */
  entryType = CONST_LAYER_ENTRY_TYPES.GROUP;

  /**
   * Initial settings to apply to the GeoView layer entry at creation time. Initial settings are inherited from the parent in the
   * configuration tree.
   */
  initialSettings?: TypeLayerInitialSettings;

  /** The list of layer entry configurations to use from the GeoView layer group. */
  listOfLayerEntryConfig: TypeListOfLayerEntryConfig = [];

  /**
   * The class constructor.
   * @param {GroupLayerEntryConfig} layerConfig The layer configuration we want to instanciate.
   * @param {string} parentLayerPath The layer path to the parent configuration.
   */
  constructor(layerConfig: GroupLayerEntryConfig, parentLayerPath?: string) {
    super(layerConfig, parentLayerPath);
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
