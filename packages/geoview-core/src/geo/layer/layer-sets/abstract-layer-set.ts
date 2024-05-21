import { Pixel } from 'ol/pixel';
import { Coordinate } from 'ol/coordinate';
import { Extent } from 'ol/extent';
import Feature from 'ol/Feature';
import RenderFeature from 'ol/render/Feature';
import EventHelper, { EventDelegateBase } from '@/api/events/event-helper';
import { TypeLayerStatus } from '@/geo/map/map-schema-types';
import { AbstractGeoViewLayer, TypeGeoviewLayerType } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { getLocalizedValue } from '@/core/utils/utilities';
import { ConfigBaseClass, LayerStatusChangedEvent } from '@/core/utils/config/validation-classes/config-base-class';
import { TypeHoverLayerData } from './hover-feature-info-layer-set';
import { LayerApi } from '@/geo/layer/layer';
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';
import { AbstractGVLayer } from '../gv-layers/abstract-gv-layer';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import { logger } from '@/core/utils/logger';

/**
 * A class to hold a set of layers associated with a value of any type.
 * Layers are added/removed to the layer-set via the registerOrUnregisterLayer function.
 * @class LayerSet
 * @exports
 */
export abstract class AbstractLayerSet {
  /** The LayerApi to work with */
  protected layerApi: LayerApi;

  /** An object containing the result sets indexed using the layer path */
  resultSet: TypeResultSet = {};

  /** Indicates the default when registering layer */
  #defaultRegisterLayerCheck = true;

  // Keep all callback delegates references
  #onLayerSetUpdatedHandlers: LayerSetUpdatedDelegate[] = [];

  /**
   * Constructs a new LayerSet instance.
   * @param {LayerApi} layerApi - The LayerApi instance to work with.
   */
  constructor(layerApi: LayerApi) {
    this.layerApi = layerApi;
  }

  // Shortcut to get the map id
  protected get mapId(): string {
    return this.layerApi.mapId;
  }

  /**
   * Registers or Unregisters the layer in the layer-set, making sure the layer-set is aware of the layer.
   * @param {ConfigBaseClass} layerConfig - The layer config
   * @param {'add' | 'remove'} action - The action to perform: 'add' to register or 'remove' to unregister
   */
  public registerOrUnregisterLayer(layerConfig: ConfigBaseClass, action: 'add' | 'remove'): void {
    // Update the registration of all layer sets if !payload.layerSetId or update only the specified layer set
    let workedOn = false;
    if (action === 'add' && this.onRegisterLayerCheck(layerConfig) && !(layerConfig.layerPath in this.resultSet)) {
      // Call the registration function for the layer-set. This method is different for each child.
      this.onRegisterLayer(layerConfig);

      // Inform that the layer set has been worked on
      workedOn = true;
    } else if (action === 'remove' && layerConfig.layerPath in this.resultSet) {
      // Call the unregistration function for the layer-set. This method is different for each child.
      this.onUnregisterLayer(layerConfig);

      // Inform that the layer set has been worked on
      workedOn = true;
    }

    // If worked on
    if (workedOn) {
      // Inform that the layer set has been updated
      this.onLayerSetUpdatedProcess(layerConfig);
    }
  }

  /**
   * An overridable registration condition function for a layer-set to check if the registration
   * should happen for a specific geoview layer and layer path.
   * @param {ConfigBaseClass} layerConfig - The layer config
   * @returns {boolean} True if the layer should be registered, false otherwise
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onRegisterLayerCheck(layerConfig: ConfigBaseClass): boolean {
    // Override this function to perform registration condition logic in the inherited classes
    // By default, a layer-set always registers layers
    return this.#defaultRegisterLayerCheck;
  }

  /**
   * An overridable registration function for a layer-set that the registration process will use to
   * create a new entry in the layer set for a specific geoview layer and layer path.
   * @param {ConfigBaseClass} layerConfig - The layer config
   */
  protected onRegisterLayer(layerConfig: ConfigBaseClass): void {
    // Register the layer status changed handler
    layerConfig.onLayerStatusChanged((config: ConfigBaseClass, layerStatusEvent: LayerStatusChangedEvent) => {
      this.#handleLayerStatusChanged(config, layerStatusEvent.layerStatus);
    });

    // Prep the resultSet
    this.resultSet[layerConfig.layerPath] = {
      data: undefined,
      layerStatus: layerConfig.layerStatus,
      layerName: getLocalizedValue(layerConfig.layerName, AppEventProcessor.getDisplayLanguage(this.mapId)),
    };

    // Override this function to perform further registration logic in the inherited classes
  }

  /**
   * An overridable unregistration function for a layer-set that the registration process will use to
   * unregister a specific geoview layer and layer path.
   * @param {ConfigBaseClass} layerConfig - The layer config
   */
  protected onUnregisterLayer(layerConfig: ConfigBaseClass): void {
    // Delete the result set for the layer path
    delete this.resultSet[layerConfig.layerPath];

    // Override this function to perform further unregistration logic in the inherited classes
  }

  /**
   * Handles when the layer status changes on a layer config.
   * @param {ConfigBaseClass} layerConfig - The layer config
   * @param {TypeLayerStatus} layerStatus - The new layer status
   */
  #handleLayerStatusChanged(layerConfig: ConfigBaseClass, layerStatus: TypeLayerStatus): void {
    try {
      // The layer status has changed for the given config/layer, take care of it

      // Log - leaving the line in comment as it can be pretty useful to uncomment it sometimes
      // logger.logDebug('LAYER STATUS CHANGED', layerConfig.layerPath, layerStatus, layerConfig);

      // Call the overridable function to process a layer status is changing
      this.onProcessLayerStatusChanged(layerConfig, layerStatus);

      // Emit the layer set updated changed event
      this.onLayerSetUpdatedProcess(layerConfig);
    } catch (error) {
      // Log
      logger.logError('CAUGHT in handleLayerStatusChanged', layerConfig.layerPath, error);
    }
  }

  /**
   * An overridable function for a layer-set to process a layer status changed event.
   * @param {ConfigBaseClass} layerConfig - The layer config
   * @param {TypeLayerStatus} layerStatus - The new layer status
   */
  protected onProcessLayerStatusChanged(layerConfig: ConfigBaseClass, layerStatus: TypeLayerStatus): void {
    // Change the layer status!
    this.resultSet[layerConfig.layerPath].layerStatus = layerStatus;

    // TODO: Cleanup - Commenting this for now.. not that useful and confusing with other similar processing happening in other places too..
    // if (['processed', 'error'].includes(layerStatus) && !this.resultSet[layerPath].layerName) {
    //   const layerConfig = this.layerApi.getLayerEntryConfig(layerPath)!;
    //   const layerName = getLocalizedValue(layerConfig.layerName, AppEventProcessor.getDisplayLanguage(this.mapId));
    //   if (layerName) this.resultSet[layerPath].layerName = layerName;
    //   else {
    //     this.resultSet[layerPath].layerName = getLocalizedValue(
    //       {
    //         en: `Anonymous Layer`,
    //         fr: `Couche Anonyme`,
    //       },
    //       AppEventProcessor.getDisplayLanguage(this.mapId)
    //     );
    //   }

    //   // Synchronize the layer name property in the config and the layer set object when the geoview instance is ready.
    //   if (!layerConfig.layerName) layerConfig.layerName = createLocalizedString(this.resultSet[layerPath].layerName!);

    //   // There is a synch issue when layerName is not set on the layerConfig when layer is registered, it wil not appear in UI
    //   if (this.resultSet[layerPath].data)
    //     (Cast<TypeJsonObject>(this.resultSet[layerPath].data).layerName as string) = this.resultSet[layerPath].layerName!;
    // }
  }

  /**
   * An overridable layer set updated function for a layer-set to indicate the layer set has been updated.
   * @param {string} layerConfig - The layer config
   */
  protected onLayerSetUpdatedProcess(layerConfig: ConfigBaseClass): void {
    // Emit layer set updated event to the outside
    this.#emitLayerSetUpdated({ layerPath: layerConfig.layerPath, resultSet: this.resultSet });
  }

  /**
   * Processes layer data to query features on it, if the layer path can be queried.
   * @param {TypeLayerData | TypeHoverLayerData} data - The layer data
   * @param {ConfigBaseClass} layerConfig - The layer configuration
   * @param {AbstractGeoViewLayer | AbstractGVLayer} geoviewLayer - The geoview layer
   * @param {QueryType} queryType - The query type
   * @param {TypeLocation} location - The location for the query
   * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} A promise resolving to the query results
   */
  protected static queryLayerFeatures(
    data: TypeLayerData | TypeHoverLayerData,
    layerConfig: ConfigBaseClass,
    geoviewLayer: AbstractGeoViewLayer | AbstractGVLayer,
    queryType: QueryType,
    location: TypeLocation
  ): Promise<TypeFeatureInfoEntry[] | undefined | null> {
    // If event listener is enabled, query status isn't in error, and geoview layer instance is defined
    if (data.eventListenerEnabled && data.queryStatus !== 'error') {
      // If source is queryable
      if ((layerConfig as AbstractBaseLayerEntryConfig)?.source?.featureInfo?.queryable) {
        // Get Feature Info
        return Promise.resolve(geoviewLayer.getFeatureInfo(queryType, layerConfig.layerPath, location));
      }
    }
    // No query made
    return Promise.resolve(null);
  }

  /**
   * Emits an event to all registered handlers.
   * @param {LayerSetUpdatedEvent} event - The event to emit
   * @private
   */
  #emitLayerSetUpdated(event: LayerSetUpdatedEvent): void {
    // Emit the layersetupdated event
    EventHelper.emitEvent(this, this.#onLayerSetUpdatedHandlers, event);
  }

  /**
   * Registers a callback to be executed whenever the layer set is updated.
   * @param {LayerSetUpdatedDelegate} callback - The callback function
   */
  onLayerSetUpdated(callback: LayerSetUpdatedDelegate): void {
    // Register the layersetupdated event callback
    EventHelper.onEvent(this.#onLayerSetUpdatedHandlers, callback);
  }

  /**
   * Unregisters a callback from being called whenever the layer set is updated.
   * @param {LayerSetUpdatedDelegate} callback - The callback function to unregister
   */
  offLayerSetUpdated(callback: LayerSetUpdatedDelegate): void {
    // Unregister the layersetupdated event callback
    EventHelper.offEvent(this.#onLayerSetUpdatedHandlers, callback);
  }
}

// TODO: Rename this type to something like 'store-container-type' as it is now mostly used to indicate in which store to propagate the result set
// TO.DOCONT: Be mindful if you rename the eventType property in the event payload to the outside! Because lots of templates expect an 'eventType' in the payload.
// TO.DOCONT: Ideally, get rid of it completely. The templates should be self aware of the layer-set that responded to their request now.
export type EventType = 'click' | 'hover' | 'all-features';

export const ArrayOfEventTypes: EventType[] = ['click', 'hover', 'all-features'];

export type QueryType = 'at_pixel' | 'at_coordinate' | 'at_long_lat' | 'using_a_bounding_box' | 'using_a_polygon' | 'all';

export type TypeQueryStatus = 'init' | 'processing' | 'processed' | 'error';

export type TypeLocation = null | Pixel | Coordinate | Coordinate[] | string;

export type TypeLayerData = {
  layerPath: string;
  layerName: string;
  layerStatus: TypeLayerStatus;
  eventListenerEnabled: boolean;
  // When property features is undefined, we are waiting for the query result.
  // when Array.isArray(features) is true, the features property contains the query result.
  // when property features is null, the query ended with an error.
  queryStatus: TypeQueryStatus;
  features: TypeFeatureInfoEntry[] | undefined | null;
};

export type TypeFeatureInfoByEventTypes = {
  [eventName in EventType]?: TypeLayerData;
};

// TODO: Move the definition of the domain in the new schema
// TODO.CONT: Starting here vvvv
export type codeValueEntryType = {
  name: string;
  code: unknown;
};

export type codedValueType = {
  type: 'codedValue';
  name: string;
  description: string;
  codedValues: codeValueEntryType[];
};

export type rangeDomainType = {
  type: 'range';
  name: string;
  range: [minValue: unknown, maxValue: unknown];
};

export type TypeFieldEntry = {
  fieldKey: number;
  value: unknown;
  dataType: 'string' | 'date' | 'number';
  alias: string;
  domain: null | codedValueType | rangeDomainType;
};

export interface TypeGeometry extends RenderFeature {
  ol_uid: string;
}

export type TypeFeatureInfoEntry = {
  featureKey: number;
  geoviewLayerType: TypeGeoviewLayerType;
  extent: Extent | undefined;
  geometry: TypeGeometry | Feature | null;
  featureIcon: HTMLCanvasElement;
  fieldInfo: Partial<Record<string, TypeFieldEntry>>;
  nameField: string | null;
};

/**
 * Partial definition of a TypeFeatureInfoEntry for simpler use case queries.
 * Purposely linking this simpler type to the main TypeFeatureInfoEntry type here, in case, for future we want
 * to add more information on one or the other and keep things loosely linked together.
 */
export type TypeFeatureInfoEntryPartial = Pick<TypeFeatureInfoEntry, 'fieldInfo'>;

/**
 * Define a delegate for the event handler function signature
 */
type LayerSetUpdatedDelegate = EventDelegateBase<AbstractLayerSet, LayerSetUpdatedEvent>;

/**
 * Define an event for the delegate
 */
export type LayerSetUpdatedEvent = {
  layerPath: string;
  resultSet: TypeResultSet;
};

export type TypeResultSetEntry = {
  layerName?: string;
  layerStatus: TypeLayerStatus;
  data: unknown;
};

export type TypeResultSet = {
  [layerPath: string]: TypeResultSetEntry;
};
