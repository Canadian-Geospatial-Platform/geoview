/* eslint-disable no-underscore-dangle */
// ? we escape all private attribute in this file
import BaseLayer from 'ol/layer/Base';
import LayerGroup from 'ol/layer/Group';

import {
  TypeBaseSourceVectorInitialConfig,
  TypeLayerAndListenerType,
  TypeLayerInitialSettings,
  TypeLocalizedString,
  TypeSourceImageEsriInitialConfig,
  TypeSourceImageInitialConfig,
  TypeSourceImageStaticInitialConfig,
  TypeSourceImageWmsInitialConfig,
  TypeSourceTileInitialConfig,
  TypeVectorSourceInitialConfig,
  TypeVectorTileSourceInitialConfig,
  layerEntryIsGroupLayer,
} from '@/geo/map/map-schema-types';
import { logger } from '../../logger';
import { LayerSetPayload, TypeJsonValue, api } from '@/app';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';

/** ******************************************************************************************************************************
 * Base type used to define a GeoView layer to display on the map.
 */
export abstract class AbstractBaseLayerEntryConfig extends ConfigBaseClass {
  /** The ending element of the layer configuration path. */
  layerIdExtension?: string | undefined = undefined;

  /** The display name of the layer (English/French). */
  layerName?: TypeLocalizedString;

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
   */
  constructor(layerConfig: AbstractBaseLayerEntryConfig) {
    super(layerConfig);
    Object.assign(this, layerConfig);
  }

  /**
   * The olLayerAndLoadEndListeners setter method for the ConfigBaseClass class and its descendant classes.
   * @param {TypeLayerAndListenerType} layerAndListenerType The layer configuration we want to instanciate
   *                                                        and its listener type.
   */
  // TODO: Replace the setter/getter functions with methods actiong on private properties.
  set olLayerAndLoadEndListeners(layerAndListenerType: TypeLayerAndListenerType) {
    const { olLayer, loadEndListenerType } = layerAndListenerType;
    this._olLayer = olLayer;
    // Group layers have no listener
    if (olLayer && this.entryType !== 'group') {
      if (loadEndListenerType) {
        let loadErrorListener: () => void;

        // Definition of the load end listener functions
        const loadEndListener = () => {
          this.loadedFunction();
          this.layerStatus = 'loaded';
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (this._olLayer! as any).get('source').un(`${loadEndListenerType}loaderror`, loadErrorListener);
        };

        loadErrorListener = () => {
          this.layerStatus = 'error';
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (this._olLayer! as any).get('source').un(`${loadEndListenerType}loadend`, loadEndListener);
        };

        // Activation of the load end listeners
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this._olLayer! as any).get('source').once(`${loadEndListenerType}loaderror`, loadErrorListener);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this._olLayer! as any).get('source').once(`${loadEndListenerType}loadend`, loadEndListener);
      } else logger.logError(`Provision of a load end listener type is mandatory for layer path "${this.layerPath}".`);
    }
  }

  /**
   * The olLayer getter method for the ConfigBaseClass class and its descendant classes.
   * All layerConfig has an olLayer property, but the olLayer setter can only be use on group layers.
   */
  get olLayer() {
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
    if (layerEntryIsGroupLayer(this)) this._olLayer = olLayerValue;
    else logger.logError(`The olLayer setter can only be used on layer group and layerPath refers to a layer of type "${this.entryType}".`);
  }

  /**
   * Method to execute when the layer is loaded.
   */
  loadedFunction() {
    // Update registration based on metadata that were read since the first registration.
    this.geoviewLayerInstance?.registerToLayerSets(this);
    this.geoviewLayerInstance?.setVisible(this.initialSettings?.visible !== 'no', this.layerPath);
    if (this._layerStatus === 'loaded')
      api.event.emit(LayerSetPayload.createLayerSetChangeLayerStatusPayload(this.geoviewLayerInstance!.mapId, this.layerPath, 'loaded'));
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
