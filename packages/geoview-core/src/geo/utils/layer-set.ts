import { Pixel } from 'ol/pixel';
import { Coordinate } from 'ol/coordinate';
import { Extent } from 'ol/extent';
import Feature from 'ol/Feature';
import RenderFeature from 'ol/render/Feature';
import { LayerApi } from '@/app';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import EventHelper, { EventDelegateBase } from '@/api/events/event-helper';
import { TypeLayerStatus } from '@/geo/map/map-schema-types';
import { AbstractGeoViewLayer, TypeGeoviewLayerType } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { createLocalizedString, getLocalizedValue } from '@/core/utils/utilities';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';

import { TypeHoverLayerData } from './hover-feature-info-layer-set';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';

/**
 * A class to hold a set of layers associated with an value of any type.
 * Layers are added/removed to the layer-set via the registerOrUnregisterLayer function.
 *
 * @class LayerSet
 */
export class LayerSet {
  /** The LayerApi to work with */
  protected layerApi: LayerApi;

  /** An object containing the result sets indexed using the layer path */
  resultSet: TypeResultSet = {};

  /** Sequence number to append to the layer name when we declare a layer as anonymous. */
  protected anonymousSequenceNumber = 1;

  // Keep all callback delegates references
  #onLayerSetUpdatedHandlers: LayerSetUpdatedDelegate[] = [];

  /**
   * The class constructor that instanciate a set of layer.
   *
   * @param {LayerApi} layerApi The layer Api to work with.
   */
  constructor(layerApi: LayerApi) {
    this.layerApi = layerApi;
  }

  // Shortcut to get the map id
  protected get mapId() {
    return this.layerApi.mapId;
  }

  /**
   * Processes the layer status change in the layer-set.
   * @param {ConfigBaseClass} config The layer config class
   * @param {string} layerPath The layer path being affected
   * @param {string} layerStatus The new layer status
   */
  public processLayerStatusChanged(config: ConfigBaseClass, layerPath: string, layerStatus: TypeLayerStatus): void {
    // Call the overridable function to process a layer status changed
    this.onProcessLayerStatusChanged(config, layerPath, layerStatus);
  }

  /**
   * An overridable function for a layer-set to process a layer status changed event.
   * @param {ConfigBaseClass} config The layer config class
   * @param {string} layerPath The layer path being affected
   * @param {string} layerStatus The new layer status
   */
  protected onProcessLayerStatusChanged(config: ConfigBaseClass, layerPath: string, layerStatus: TypeLayerStatus): void {
    // if layer's status flag exists and is different than the new one
    if (this.resultSet?.[layerPath]?.layerStatus && this.resultSet?.[layerPath]?.layerStatus !== layerStatus) {
      // Change the layer status!
      this.resultSet[layerPath].layerStatus = layerStatus;

      if (['processed', 'error'].includes(layerStatus) && !this.resultSet[layerPath].layerName) {
        const layerConfig = this.layerApi.registeredLayers[layerPath];
        const layerName = getLocalizedValue(layerConfig.layerName, this.mapId);
        if (layerName) this.resultSet[layerPath].layerName = layerName;
        else {
          this.resultSet[layerPath].layerName = getLocalizedValue(
            {
              en: `Anonymous Layer ${this.anonymousSequenceNumber}`,
              fr: `Couche Anonyme ${this.anonymousSequenceNumber}`,
            },
            this.mapId
          );
          this.anonymousSequenceNumber++;
        }

        // Synchronize the layer name property in the config and the layer set object when the geoview instance is ready.
        if (!layerConfig.layerName) layerConfig.layerName = createLocalizedString(this.resultSet[layerPath].layerName!);
      }

      // Inform that the layer set has been updated
      this.onLayerSetUpdatedProcess(layerPath);
    }
  }

  /**
   * Registers or Unregisters the layer in the layer-set, making sure the layer-set is aware of the layer.
   * @param {AbstractGeoViewLayer} geoviewLayer The layer to register/unregister
   * @param {string} action The action to register(add) or unregister(remove) the layer
   */
  public registerOrUnregisterLayer(geoviewLayer: AbstractGeoViewLayer, layerPath: string, action: 'add' | 'remove'): void {
    // Update the registration of all layer sets if !payload.layerSetId or update only the specified layer set
    if (action === 'add' && this.onRegisterLayerCheck(geoviewLayer, layerPath) && !(layerPath in this.resultSet)) {
      const layerConfig = this.layerApi.registeredLayers[layerPath];
      this.resultSet[layerPath] = {
        data: undefined,
        layerStatus: 'newInstance',
        layerName: getLocalizedValue(layerConfig.layerName, this.mapId),
      };

      // Call the registration function for the layer-set. This method is different for each child.
      this.onRegisterLayer(geoviewLayer, layerPath);

      // Inform that the layer set has been updated
      this.onLayerSetUpdatedProcess(layerPath);
    } else if (action === 'remove' && layerPath in this.resultSet) {
      MapEventProcessor.removeOrderedLayerInfo(this.mapId, layerPath);
      delete this.resultSet[layerPath];

      // Inform that the layer set has been updated
      this.onLayerSetUpdatedProcess(layerPath);
    }
  }

  /**
   * An overridable registration condition function for a layer-set that the registration process will use to
   * check if the registration should happen for a specific geoview layer and layer path.
   * @param {AbstractGeoViewLayer} geoviewLayer The geoview layer being registered
   * @param {string} layerPath The layer path
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onRegisterLayerCheck = (geoviewLayer: AbstractGeoViewLayer, layerPath: string): boolean => {
    // Override this function to perform registration condition logic in the inherited classes
    // By default, a layer-set always registers layers
    return true;
  };

  /**
   * An overridable registration function for a layer-set that the registration process will use to
   * create a new entry in the layer set for a specific geoview layer and layer path.
   * @param {AbstractGeoViewLayer} geoviewLayer The geoview layer being registered
   * @param {string} layerPath The layer path
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onRegisterLayer = (geoviewLayer: AbstractGeoViewLayer, layerPath: string): void => {
    // Override this function to perform registration logic in the inherited classes
    throw new Error("Not implemented exception. A 'onRegisterLayer' function was not implemented by a layer-set.");
  };

  /**
   * An overridable layer set updated function for a layer-set to indicate the layer set has been updated.
   * @param {string} layerPath The layer path
   */
  protected onLayerSetUpdatedProcess(layerPath: string): void {
    // Emit layer set updated event to the outside
    this.emitLayerSetUpdated({ layerPath, resultSet: this.resultSet });
  }

  /**
   * Process a layer result set data to query features on it, if said layer path can be queried.
   *
   * @param {TypeLayerData | TypeHoverLayerData} data
   * @param {AbstractBaseLayerEntryConfig} layerConfig
   * @param {string} layerPath
   * @param {QueryType} queryType
   * @param {TypeLocation} location
   *
   * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} promise of the results
   */
  protected queryLayerFeatures = (
    data: TypeLayerData | TypeHoverLayerData,
    layerConfig: AbstractBaseLayerEntryConfig,
    layerPath: string,
    queryType: QueryType,
    location: TypeLocation
  ): Promise<TypeFeatureInfoEntry[] | undefined | null> => {
    // If event listener is enabled, query status isn't in error, and geoview layer instance is defined
    if (data.eventListenerEnabled && data.queryStatus !== 'error' && layerConfig.geoviewLayerInstance) {
      // If source is queryable
      if ((layerConfig as AbstractBaseLayerEntryConfig)?.source?.featureInfo?.queryable) {
        // Get Feature Info
        return Promise.resolve(layerConfig.geoviewLayerInstance.getFeatureInfo(queryType, layerPath, location));
      }
    }
    // No query made
    return Promise.resolve(null);
  };

  /**
   * Emits an event to all handlers.
   * @param {LayerSetUpdatedEvent} event The event to emit
   */
  emitLayerSetUpdated = (event: LayerSetUpdatedEvent) => {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerSetUpdatedHandlers, event);
  };

  /**
   * Wires an event handler.
   * @param {LayerSetUpdatedDelegate} callback The callback to be executed whenever the event is emitted
   */
  onLayerSetUpdated = (callback: LayerSetUpdatedDelegate): void => {
    // Wire the event handler
    EventHelper.onEvent(this.#onLayerSetUpdatedHandlers, callback);
  };

  /**
   * Unwires an event handler.
   * @param {LayerSetUpdatedDelegate} callback The callback to stop being called whenever the event is emitted
   */
  offLayerSetUpdated = (callback: LayerSetUpdatedDelegate): void => {
    // Unwire the event handler
    EventHelper.offEvent(this.#onLayerSetUpdatedHandlers, callback);
  };
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
  extent: Extent;
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
type LayerSetUpdatedDelegate = EventDelegateBase<LayerSet, LayerSetUpdatedEvent>;

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
