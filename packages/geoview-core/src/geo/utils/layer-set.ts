import { Pixel } from 'ol/pixel';
import { Coordinate } from 'ol/coordinate';
import { Extent } from 'ol/extent';
import Feature from 'ol/Feature';
import RenderFeature from 'ol/render/Feature';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { EVENT_NAMES } from '@/api/events/event-types';
import {
  LayerSetPayload,
  PayloadBaseClass,
  payloadIsLayerRegistration,
  payloadIsLayerSetChangeLayerStatus,
  TypeResultSet,
} from '@/api/events/payloads';
import { TypeGeoviewLayerType } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { api, LayerApi } from '@/app';
import { TypeLayerStatus, TypeLayerEntryConfig } from '@/geo/map/map-schema-types';
import { logger } from '@/core/utils/logger';
import { createLocalizedString, getLocalizedValue } from '@/core/utils/utilities';

import { TypeHoverLayerData } from './hover-feature-info-layer-set';

/** ***************************************************************************************************************************
 * A class to hold a set of layers associated with an value of any type. When this class is instantiated, all layers already
 * loaded on the specified map that have a return value equal to true when the registrationConditionFunction is called using
 * the layer path as a parameter will be added to the set. Layers added afterwards will be added to the set if the
 * registrationConditionFunction returns true. Deleted layers will be removed from the set.
 *
 * @class LayerSet
 */
export class LayerSet {
  /** The LayerApi to work with */
  protected layerApi: LayerApi;

  /** The map identifier the layer set belongs to. */
  protected mapId: string;

  /** The layer set identifier. */
  protected layerSetId: string;

  /** An object containing the result sets indexed using the layer path */
  resultSet: TypeResultSet;

  /** Function used to determine if the layerPath can be added to the layer set. */
  protected registrationConditionFunction: (layerPath: string) => boolean;

  /** Function used to initialise the data property of the layer path entry. */
  protected registrationUserInitialisation?: (layerPath: string) => void;

  /** Sequence number to append to the layer name when we declare a layer as anonymous. */
  protected anonymousSequenceNumber = 1;

  /**
   * The class constructor that instanciate a set of layer.
   *
   * @param {LayerApi} layerApi The layer Api to work with.
   * @param {string} mapId The map identifier the layer set belongs to.
   * @param {string} layerSetIdentifier The layer set identifier.
   * @param {TypeResultSet} resultSet An object that will contain the result sets indexed using the layer path.
   * @param {(layerPath: string) => boolean} registrationConditionFunction A function to decide if the layer can be added.
   * @param {(layerPath: string) => void} registrationUserInitialisation A function to initialise the data property of the layer path entry.
   */
  constructor(
    layerApi: LayerApi,
    mapId: string,
    layerSetIdentifier: string,
    resultSet: TypeResultSet,
    registrationConditionFunction?: true | ((layerPath: string) => boolean),
    registrationUserInitialisation?: (layerPath: string) => void
  ) {
    this.layerApi = layerApi;
    this.mapId = mapId;
    this.layerSetId = layerSetIdentifier;
    this.resultSet = resultSet;
    this.registrationConditionFunction =
      registrationConditionFunction === true || registrationConditionFunction === undefined
        ? () => {
            return true;
          }
        : registrationConditionFunction;
    this.registrationUserInitialisation = registrationUserInitialisation;
    this.setChangeLayerStatusListenerFunctions();
    this.setLayerRegistrationListenerFunctions();
  }

  /** ***************************************************************************************************************************
   * The listener that will handle the CHANGE_LAYER_STATUS event triggered on the map.
   *
   * @param {PayloadBaseClass} payload The payload to process.
   */
  protected changeLayerStatusListenerFunctions(payload: PayloadBaseClass) {
    if (payloadIsLayerSetChangeLayerStatus(payload)) {
      // Log
      logger.logTraceCoreAPIEvent('LAYER-SET on EVENT_NAMES.LAYER_SET.CHANGE_LAYER_STATUS', this.mapId, payload);

      const { layerPath, layerStatus } = payload;
      // if layer's status flag exists and is different than the new one
      if (this.resultSet?.[layerPath]?.layerStatus && this.resultSet?.[layerPath]?.layerStatus !== layerStatus) {
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
        api.event.emit(LayerSetPayload.createLayerSetUpdatedPayload(this.layerSetId, this.resultSet, layerPath));
      }
    }
  }

  /** ***************************************************************************************************************************
   * Set the listener that will handle the CHANGE_LAYER_STATUS event triggered on the map.
   */
  protected setChangeLayerStatusListenerFunctions() {
    api.event.on(
      EVENT_NAMES.LAYER_SET.CHANGE_LAYER_STATUS,
      (payload) => {
        // Logger is called in the changeLayerStatusListenerFunctions above.
        this.changeLayerStatusListenerFunctions.call(this, payload);
      },
      this.mapId
    );
  }

  /** ***************************************************************************************************************************
   * Set the listener that will handle the LAYER_REGISTRATION event triggered on the map. Layer registration is the action of
   * adding or deleting a layer in the layerset
   */
  private setLayerRegistrationListenerFunctions() {
    // Register a layer to the layer set or unregister the layer when it is deleted from the map.
    api.event.on(
      EVENT_NAMES.LAYER_SET.LAYER_REGISTRATION,
      (payload) => {
        // Log
        logger.logTraceCoreAPIEvent('LAYER-SET - LAYER_REGISTRATION', this.mapId, payload);

        if (payloadIsLayerRegistration(payload)) {
          const { action, layerPath, layerSetId } = payload;
          // update the registration of all layer sets if !payload.layerSetId or update only the specified layer set
          if (!layerSetId || layerSetId === this.layerSetId) {
            if (action === 'add' && this.registrationConditionFunction(layerPath) && !(layerPath in this.resultSet)) {
              const layerConfig = this.layerApi.registeredLayers[layerPath];
              this.resultSet[layerPath] = {
                data: undefined,
                layerStatus: 'newInstance',
                layerName: getLocalizedValue(layerConfig.layerName, this.mapId),
              };
              if (this.registrationUserInitialisation) this.registrationUserInitialisation(layerPath);
            } else if (action === 'remove' && layerPath in this.resultSet) {
              MapEventProcessor.removeOrderedLayerInfo(this.mapId, layerPath);
              delete this.resultSet[layerPath];
            }
            api.event.emit(LayerSetPayload.createLayerSetUpdatedPayload(this.layerSetId, this.resultSet, layerPath));
          }
        }
      },
      this.mapId
    );

    // Send a request layer inventory signal to all existing layers of the map. These layers will return a layer registration event.
    api.event.emit(LayerSetPayload.createRequestLayerInventoryPayload(this.mapId, this.layerSetId));
  }

  /**
   * Helper function used to instanciate a LayerSet object. This function
   * avoids the "new LayerSet" syntax.
   *
   * @param {LayerApi} layerApi The layer Api to work with.
   * @param {string} mapId The map identifier the layer set belongs to.
   * @param {string} layerSetId The layer set identifier.
   * @param {TypeResultSet} resultSet An object that will contain the result sets indexed using the layer path.
   * @param {(layerPath: string) => boolean} registrationConditionFunction A function to decide if the layer can be added.
   *
   * @returns {LayerSet} the LayerSet object created
   */
  static create(
    layerApi: LayerApi,
    mapId: string,
    layerSetId: string,
    resultSet: TypeResultSet,
    registrationConditionFunction: (layerPath: string) => boolean
  ): LayerSet {
    return new LayerSet(layerApi, mapId, layerSetId, resultSet, registrationConditionFunction);
  }

  /**
   * Process a layer result set data to query features on it, if said layer path can be queried.
   *
   * @param {TypeLayerData | TypeHoverLayerData} data
   * @param {TypeLayerEntryConfig} layerConfig
   * @param {string} layerPath
   * @param {QueryType} queryType
   * @param {TypeLocation} location
   */
  processQueryResultSetData = (
    data: TypeLayerData | TypeHoverLayerData,
    layerConfig: TypeLayerEntryConfig,
    layerPath: string,
    queryType: QueryType,
    location: TypeLocation
  ): Promise<TypeArrayOfFeatureInfoEntries | null> => {
    // If event listener is enabled, query status isn't in error, and geoview layer instance is defined
    if (data.eventListenerEnabled && data.queryStatus !== 'error' && layerConfig.geoviewLayerInstance) {
      // If source is queryable
      if (layerConfig?.source?.featureInfo?.queryable) {
        // Get Feature Info
        return Promise.resolve(layerConfig.geoviewLayerInstance.getFeatureInfo(queryType, layerPath, location));
      }
    }
    // No query made
    return Promise.resolve(null);
  };
}

export type EventType = 'click' | 'hover' | 'crosshaire-enter' | 'all-features';
export const ArrayOfEventTypes: EventType[] = ['click', 'hover', 'crosshaire-enter', 'all-features'];
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
  features: TypeArrayOfFeatureInfoEntries;
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

export type TypeArrayOfFeatureInfoEntries = TypeFeatureInfoEntry[] | undefined | null;
