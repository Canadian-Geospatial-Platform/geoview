// ? we escape all private attribute in this file
import BaseLayer from 'ol/layer/Base';
import LayerGroup from 'ol/layer/Group';

import {
  CONST_LAYER_ENTRY_TYPES,
  TypeBaseSourceVectorInitialConfig,
  TypeLayerAndListenerType,
  TypeLayerInitialSettings,
  TypeSourceImageEsriInitialConfig,
  TypeSourceImageInitialConfig,
  TypeSourceImageStaticInitialConfig,
  TypeSourceImageWmsInitialConfig,
  TypeSourceTileInitialConfig,
  TypeVectorSourceInitialConfig,
  TypeVectorTileSourceInitialConfig,
  layerEntryIsGroupLayer,
} from '@/geo/map/map-schema-types';
import { logger } from '@/core/utils/logger';
import { TypeJsonValue } from '@/core/types/global-types';
import { GroupLayerEntryConfig } from './group-layer-entry-config';

/** ******************************************************************************************************************************
 * Base type used to define a GeoView layer to display on the map.
 */
export abstract class AbstractBaseLayerEntryConfig extends GroupLayerEntryConfig {
  // TODO: Remove this property and explain in the doc how users can do the same with only the layerId in the config.
  // TO.DOCONT: Developers often forget that the complete layerID is the concatenation of layerId.layerIdExtension.
  // TO.DOCONT: The users can do that in the configuration using only layerId: 'theLayerId.TheExtension'
  /** The ending extension (element) of the layer identifier. This element is part of the schema. */
  private privateLayerIdExtension?: string;

  /**
   * Initial settings to apply to the GeoView layer entry at creation time. Initial settings are inherited from the parent in the
   * configuration tree.
   */
  initialSettings?: TypeLayerInitialSettings = {};

  /** Source settings to apply to the GeoView vector layer source at creation time. */
  source?:
    | TypeBaseSourceVectorInitialConfig
    | TypeSourceTileInitialConfig
    | TypeVectorSourceInitialConfig
    | TypeVectorTileSourceInitialConfig
    | TypeSourceImageInitialConfig
    | TypeSourceImageWmsInitialConfig
    | TypeSourceImageEsriInitialConfig
    | TypeSourceImageStaticInitialConfig;

  /** The listOfLayerEntryConfig attribute is not used by child of AbstractBaseLayerEntryConfig. */
  declare listOfLayerEntryConfig: never;

  /**
   * The class constructor.
   * @param {AbstractBaseLayerEntryConfig} layerConfig The layer configuration we want to instanciate.
   * @param {string} parentLayerPath The layer path to the parent configuration.
   */
  constructor(layerConfig: AbstractBaseLayerEntryConfig, parentLayerPath?: string) {
    super(layerConfig, parentLayerPath);
    Object.assign(this, layerConfig);
  }

  /**
   * The layerId getter method for the ConfigBaseClass class and its descendant classes.
   */
  get layerIdExtension(): string | undefined {
    return this.privateLayerIdExtension;
  }

  /**
   * The layerId setter method for the ConfigBaseClass class and its descendant classes.
   * @param {string} newLayerId The new layerId value.
   */
  set layerIdExtension(newLayerIdExtension: string | undefined) {
    this.privateLayerIdExtension = newLayerIdExtension;
    const completeLayerId = this.privateLayerIdExtension ? `${this.layerId}.${this.privateLayerIdExtension}` : this.layerId;
    this.layerPath = `${this.layerPath.split('/').slice(0, -1).join('/')}/${completeLayerId}`;
  }

  /**
   * The olLayerAndLoadEndListeners setter method for the ConfigBaseClass class and its descendant classes.
   * @param {TypeLayerAndListenerType} layerAndListenerType The layer configuration we want to instanciate
   *                                                        and its listener type.
   */
  // TODO: Replace the setter/getter functions with methods acting on private properties.
  set olLayerAndLoadEndListeners(layerAndListenerType: TypeLayerAndListenerType) {
    const { olLayer, loadEndListenerType } = layerAndListenerType;
    // eslint-disable-next-line no-underscore-dangle
    this._olLayer = olLayer;
    // Group layers have no listener
    if (olLayer && this.entryType !== CONST_LAYER_ENTRY_TYPES.GROUP) {
      if (loadEndListenerType) {
        let loadErrorListener: () => void;

        // Definition of the load end listener functions
        const loadEndListener = () => {
          this.loadedFunction();
          this.layerStatus = 'loaded';
          // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-underscore-dangle
          (this._olLayer! as any).get('source').un(`${loadEndListenerType}loaderror`, loadErrorListener);
        };

        loadErrorListener = () => {
          this.layerStatus = 'error';
          // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-underscore-dangle
          (this._olLayer! as any).get('source').un(`${loadEndListenerType}loadend`, loadEndListener);
        };

        // Activation of the load end listeners
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-underscore-dangle
        (this._olLayer! as any).get('source').once(`${loadEndListenerType}loaderror`, loadErrorListener);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-underscore-dangle
        (this._olLayer! as any).get('source').once(`${loadEndListenerType}loadend`, loadEndListener);
      } else logger.logError(`Provision of a load end listener type is mandatory for layer path "${this.layerPath}".`);
    }
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
    else
      logger.logError(
        `The olLayer setter can only be used on layer group and layerPath refers to a layer of type "${
          (this as AbstractBaseLayerEntryConfig).entryType
        }".`
      );
  }

  /**
   * Method to execute when the layer is loaded.
   */
  loadedFunction() {
    // Update registration based on metadata that were read since the first registration.
    // TODO: Check - Commenting this line for now as part of big refactor (2024-03-17). It seems good to me without it so far.
    // TO.DOCONT: Maybe there was a reason for it. I'd like to see it.
    // this.geoviewLayerInstance?.registerToLayerSets(this);
    this.geoviewLayerInstance?.setVisible(this.initialSettings?.states?.visible !== false, this.layerPath);
  }

  /**
   * Serializes the TypeBaseLayerEntryConfig class
   * @returns {TypeJsonValue} The serialized TypeBaseLayerEntryConfig
   */
  serialize(): TypeJsonValue {
    // Redirect
    return this.onSerialize();
  }

  /**
   * Overrides the serialization of the mother class
   * @returns {TypeJsonValue} The serialized TypeBaseLayerEntryConfig
   */
  onSerialize(): TypeJsonValue {
    // Call parent
    const serialized = super.onSerialize() as unknown as AbstractBaseLayerEntryConfig;

    // Copy values
    serialized.layerIdExtension = this.layerIdExtension;
    serialized.layerName = this.layerName;
    serialized.initialSettings = this.initialSettings;

    // Return it
    return serialized as unknown as TypeJsonValue;
  }
}
