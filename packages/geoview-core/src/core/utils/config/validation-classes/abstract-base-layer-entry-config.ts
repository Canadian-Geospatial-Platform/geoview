/* eslint-disable no-underscore-dangle */
// ? we escape all private attribute in this file
import { TypeLocalizedString } from '@config/types/map-schema-types';
// import { layerEntryIsGroupLayer } from '@config/types/type-guards';

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
} from '@/geo/map/map-schema-types';
import { logger } from '@/core/utils/logger';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';
import { TypeJsonValue } from '@/core/types/global-types';
import { FilterNodeArrayType } from '@/geo/utils/renderer/geoview-renderer-types';

/** ******************************************************************************************************************************
 * Base type used to define a GeoView layer to display on the map.
 */
export abstract class AbstractBaseLayerEntryConfig extends ConfigBaseClass {
  /** The ending element of the layer configuration path. */
  override layerIdExtension?: string | undefined = undefined;

  /** The display name of the layer (English/French). */
  layerName?: TypeLocalizedString;

  filterEquation?: FilterNodeArrayType;

  legendFilterIsOff: boolean = false;

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
  // TODO: Replace the setter/getter functions with methods acting on private properties.
  set olLayerAndLoadEndListeners(layerAndListenerType: TypeLayerAndListenerType) {
    const { olLayer, loadEndListenerType } = layerAndListenerType;
    this._olLayer = olLayer;
    // Group layers have no listener
    if (olLayer && this.entryType !== CONST_LAYER_ENTRY_TYPES.GROUP) {
      if (loadEndListenerType) {
        let loadErrorListener: () => void;

        // Definition of the load end listener functions
        const loadEndListener = (): void => {
          this.loadedFunction();
          this.layerStatus = 'loaded';
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (this._olLayer! as any).get('source').un(`${loadEndListenerType}loaderror`, loadErrorListener);
        };

        loadErrorListener = (): void => {
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
   * Method to execute when the layer is loaded.
   */
  loadedFunction(): void {
    // Set visibility
    this.geoviewLayerInstance?.setVisible(this.initialSettings?.states?.visible !== false, this.layerPath);
  }

  /**
   * Overrides the serialization of the mother class
   * @returns {TypeJsonValue} The serialized TypeBaseLayerEntryConfig
   */
  override onSerialize(): TypeJsonValue {
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
