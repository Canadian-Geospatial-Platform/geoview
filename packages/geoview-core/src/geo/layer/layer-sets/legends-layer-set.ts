import type {
  ConfigBaseClass,
  LayerStatusChangedDelegate,
  LayerStatusChangedEvent,
} from '@/api/config/validation-classes/config-base-class';
import EventHelper, { type EventDelegateBase } from '@/api/events/event-helper';
import type { TypeLayerStyleConfig } from '@/api/types/map-schema-types';
import type { TypeGeoviewLayerType, TypeLegend } from '@/api/types/layer-schema-types';
import { logger } from '@/core/utils/logger';
import { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';
import type { TypeLegendItem, TypeLegendLayerItem } from '@/core/components/layers/types';
import { AbstractLayerSet } from '@/geo/layer/layer-sets/abstract-layer-set';
import {
  deleteStoreLayerFromLegendLayers,
  getStoreLayerIcons,
  getStoreLayerItems,
  getStoreLayerLegendQueryStatus,
  getStoreLayerLegendSchemaTag,
  getStoreLayerStyleConfig,
  setStoreLayerStatus,
  setStoreLegendQueryStatus,
} from '@/core/stores/states/layer-state';
import type { ControllerRegistry } from '@/core/controllers/base/controller-registry';
import type { LayerDomain } from '@/core/domains/layer-domain';
import type { StyleChangedDelegate, StyleChangedEvent } from '@/geo/layer/gv-layers/abstract-gv-layer';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import type { StyleAppliedDelegate, StyleAppliedEvent } from '@/geo/layer/gv-layers/vector/abstract-gv-vector';
import { AbstractGVVector } from '@/geo/layer/gv-layers/vector/abstract-gv-vector';
import type { AbstractBaseGVLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import { GVEsriDynamic } from '@/geo/layer/gv-layers/raster/gv-esri-dynamic';
import { GVEsriFeature } from '@/geo/layer/gv-layers/vector/gv-esri-feature';
import { GVEsriImage } from '@/geo/layer/gv-layers/raster/gv-esri-image';
import type { MapViewer } from '@/geo/map/map-viewer';
import { GeoUtilities } from '@/geo/utils/utilities';

/**
 * A Layer-set working with the LayerSetController at handling a result set of registered layers and synchronizing
 * events happening on them (in this case when the layers are going through the layer statuses and legend querying) with a store
 * for UI updates.
 */
export class LegendsLayerSet extends AbstractLayerSet {
  /** A bounded reference to the handle layer status changed */
  #boundedHandleLayerStatusChanged: LayerStatusChangedDelegate;

  /** A bounded reference to the handle layer style changed */
  #boundedHandleLayerStyleChanged: StyleChangedDelegate;

  /** A bounded reference to the handle layer style applied */
  #boundedHandleLayerStyleApplied: StyleAppliedDelegate;

  /** Callback delegates for the legend queried event. */
  #onLegendQueriedHandlers: LegendQueriedDelegate[] = [];

  /**
   * Constructs a Legends LayerSet to manage layers legends.
   *
   * @param mapViewer - The map viewer
   * @param controllerRegistry - The controller registry
   * @param layerDomain - The layer domain
   */
  constructor(mapViewer: MapViewer, controllerRegistry: ControllerRegistry, layerDomain: LayerDomain) {
    super(mapViewer, controllerRegistry, layerDomain);
    this.#boundedHandleLayerStatusChanged = this.#handleLayerStatusChanged.bind(this);
    this.#boundedHandleLayerStyleChanged = this.#handleLayerStyleChanged.bind(this);
    this.#boundedHandleLayerStyleApplied = this.#handleStyleApplied.bind(this);
  }

  // #region OVERRIDES

  /**
   * Overrides the behavior to apply when an all-feature-info-layer-set wants to check for condition to register a layer in its set.
   *
   * @param layerConfig - The layer config
   * @returns True when the layer should be registered to this legends-layer-set
   */
  protected override onRegisterLayerConfigCheck(layerConfig: ConfigBaseClass): boolean {
    // Always register layer configs for the legends-layer-set, because we want 'the box' in the UI to show
    // the layer status progression, unless it's a basemap layer.
    return layerConfig.getGeoviewLayerConfig().useAsBasemap !== true;
  }

  /**
   * Overrides the behavior to apply when an all-feature-info-layer-set wants to check for condition to register a layer in its set.
   *
   * @param layer - The layer
   * @returns True when the layer should be registered to this legends-layer-set
   */
  protected override onRegisterLayerCheck(layer: AbstractBaseGVLayer): boolean {
    // Always register layers for the legends-layer-set, because we want 'the box' in the UI to show
    // the layer status progression, unless it's a basemap layer.
    return layer.getLayerConfig().getGeoviewLayerConfig().useAsBasemap !== true;
  }

  /**
   * Overrides the behavior to apply when a legends-layer-set wants to register a layer in its set.
   *
   * @param layerConfig - The layer config
   */
  protected override onRegisterLayerConfig(layerConfig: ConfigBaseClass): void {
    // Call parent
    super.onRegisterLayerConfig(layerConfig);

    // Register the layer status changed handler
    layerConfig.onLayerStatusChanged(this.#boundedHandleLayerStatusChanged);

    // Propagate to the store as the config has been registered
    this.controllerRegistry.layerSetController.propagateLegendToStore(layerConfig.layerPath);
  }

  /**
   * Overrides the behavior to apply when a legends-layer-set wants to unregister a layer in its set.
   *
   * @param layerConfig - The layer config
   */
  protected override onUnregisterLayerConfig(layerConfig: ConfigBaseClass | undefined): void {
    // Call parent
    super.onUnregisterLayerConfig(layerConfig);

    // Unregister the layer status changed handler
    layerConfig?.offLayerStatusChanged(this.#boundedHandleLayerStatusChanged);
  }

  /**
   * Overrides the behavior to apply when a legends-layer-set wants to register a layer in its set.
   *
   * @param layer - The layer
   */
  protected override onRegisterLayer(layer: AbstractBaseGVLayer): void {
    // Call parent
    super.onRegisterLayer(layer);

    // If regular layer
    if (layer instanceof AbstractGVLayer) {
      // If Vector layer
      if (layer instanceof AbstractGVVector) {
        // Register handler when the style has been applied
        layer.onStyleApplied(this.#boundedHandleLayerStyleApplied);
      }

      // Register handler on layer style change
      layer.onLayerStyleChanged(this.#boundedHandleLayerStyleChanged);
    }

    // Propagate to the store as the layer has been registered.
    // GV Without this call, the order of the layers can be off
    // GV Test with http://localhost:8080/demos-navigator.html?config=./configs/navigator/demos/10-basic-appbar-data-table-tab.json
    this.controllerRegistry.layerSetController.propagateLegendToStore(layer.getLayerPath());

    // Check if ready to query legend
    this.#checkQueryLegend(layer, false);
  }
  /**
   * Overrides the behavior to apply when deleting from the store.
   *
   * @param layerPath - The layer path to delete from the store
   */
  protected override onDeleteFromStore(layerPath: string): void {
    // Delete from store
    deleteStoreLayerFromLegendLayers(this.getMapId(), layerPath);
  }

  // #endregion OVERRIDES

  // #region PUBLIC METHODS

  /**
   * Queries the legend for the given layer path.
   *
   * @param layerPath - The layer path to query the legend for
   * @param forced - Whether to force the query even if already queried
   */
  queryLegend(layer: AbstractBaseGVLayer, forced = false): void {
    // Trigger the check/query process
    this.#checkQueryLegend(layer, forced);
  }

  /**
   * Waits for the legend of the given layer path to be queried.
   *
   * Sync-checks the store first and resolves immediately when the legend query status is already `queried`.
   * Otherwise, subscribes to the legend-queried event and resolves when a valid legend payload arrives.
   * Payloads without a legend are ignored, and `no data` icon payloads are also ignored unless `acceptNoData`
   * is true, allowing the waiter to keep listening until a real legend is available.
   *
   * @param layerPath - The layer path to wait on
   * @param acceptNoIconsOrNoData - Optional flag. When true, a legend whose first icon is `no data` is treated as a valid resolution. Defaults to false
   * @returns A promise that resolves once the layer legend has been queried
   */
  waitForLegendQueried(layerPath: string, acceptNoIconsOrNoData = false): Promise<LegendQueriedEvent> {
    // Sync check: legend already queried
    if (getStoreLayerLegendQueryStatus(this.getMapId(), layerPath) === 'queried')
      return Promise.resolve({
        layerPath,
        legendSchemaTag: getStoreLayerLegendSchemaTag(this.getMapId(), layerPath),
        styleConfig: getStoreLayerStyleConfig(this.getMapId(), layerPath),
        icons: getStoreLayerIcons(this.getMapId(), layerPath),
        items: getStoreLayerItems(this.getMapId(), layerPath),
      });

    // Subscribe via onceLegendQueried with a filter that matches the layer path and accepts/rejects no-data icons
    return this.onceLegendQueried((event) => {
      // Skip events from other layers — LegendsLayerSet emits for every layer registered to this map
      if (event.layerPath !== layerPath) return false;

      // Skip if not accepting no data and the icon is a 'no data' image; keep waiting for the next query
      if (!acceptNoIconsOrNoData && (event.icons?.length === 0 || event.icons?.[0]?.iconImage === 'no data')) return false;

      // If we got here, the event is valid and we can resolve the promise
      return true;
    });
  }

  // #endregion PUBLIC METHODS

  // #region PRIVATE METHODS

  /**
   * Checks if the layer config has reached the 'processed' status or greater and if so queries the legend.
   *
   * @param layer - The layer to check for legend
   * @param forced - Indicates if the legend query should be forced to happen (example when refreshing the legend)
   */
  #checkQueryLegend(layer: AbstractBaseGVLayer | undefined, forced: boolean): void {
    // If no layer, skip
    if (!layer) return;

    // Get the layer path
    const layerPath = layer.getLayerPath();

    // Get the layer config
    const layerConfig = layer.getLayerConfig();

    // If the layer legend should be queried (and not already querying).
    // GV Gotta make sure that we're not already querying, because EsriImage layers, for example, adjust the
    // GV style on the fly when querying legend. So, be careful not to loop!
    const styleLoopingLayerTypes = [GVEsriDynamic, GVEsriFeature, GVEsriImage];
    if (
      styleLoopingLayerTypes.some((type) => layer instanceof type) &&
      getStoreLayerLegendQueryStatus(this.getMapId(), layerPath) === 'querying'
    ) {
      return;
    }

    // If the legend should be queried
    if (this.#legendShouldBeQueried(layer, layerConfig, forced)) {
      // Save to the store about the querying happening
      setStoreLegendQueryStatus(this.getMapId(), layerPath, 'querying', undefined, undefined, undefined, undefined);

      // Query the legend
      const legendPromise = layer.queryLegend();

      // Whenever the legend response comes in
      legendPromise
        ?.then((legend: TypeLegend | null | undefined) => {
          // If legend received
          if (legend) {
            // Check for possible number of icons and set icon cache size
            this.mapViewer.updateIconImageCache(legend);

            // If any data type
            let icons: TypeLegendLayerItem[] | undefined = undefined;
            let items: TypeLegendItem[] | undefined = undefined;
            if (legend?.type) {
              // Calculate icons and items
              icons = GeoUtilities.getLayerIconImage(legend?.type, legend);
              items = GeoUtilities.getLayerItemsFromIcons(legend.type, icons);
            }

            // Save to the store once the legend is received
            setStoreLegendQueryStatus(this.getMapId(), layerPath, 'queried', legend?.type, legend?.styleConfig, icons, items);

            // Emit about the legend being queried
            this.#emitLegendQueried({ layerPath, legendSchemaTag: legend?.type, styleConfig: legend?.styleConfig, icons, items });
          }
        })
        .catch((error: unknown) => {
          // Log
          logger.logPromiseFailed('legendPromise in #checkQueryLegend in LegendsLayerSet', error);
        });
    }
  }

  /**
   * Checks if the legend should be queried as part of the regular layer status progression and legend fetching.
   *
   * Also performs a type guard on the 'layer' parameter that must be AbstractGVLayer.
   *
   * @param layer - The layer
   * @param layerConfig - The layer config
   * @param forced - Flag to force a query to happen, even if the legendQueryStatus isn't 'init' or style isn't applied
   */
  #legendShouldBeQueried(layer: AbstractBaseGVLayer, layerConfig: ConfigBaseClass, forced: boolean): layer is AbstractGVLayer {
    // A legend is ready to be queried if its status is > processed
    let shouldQueryLegend = layer instanceof AbstractGVLayer && !!layerConfig?.isGreaterThanOrEqualTo('processed');

    // If should query thus far
    if (shouldQueryLegend) {
      // If forced
      if (forced) return true;

      // If legend never queried so far
      shouldQueryLegend = getStoreLayerLegendQueryStatus(this.getMapId(), layerConfig.layerPath) === 'init';

      // If should query thus far
      if (shouldQueryLegend) {
        // If an AbstractGVVector
        if (layer instanceof AbstractGVVector && layerConfig instanceof VectorLayerEntryConfig) {
          // If there's no determined layer style in the layer config
          if (!layerConfig.getLayerStyle()) {
            // If the layer visible state is invisible upon load or the style has been applied, we should query legend
            shouldQueryLegend = !layerConfig.getInitialSettings()?.states?.visible || layer.styleApplied;
          }
        }
      }
    }

    // Return if legend should be queried
    return shouldQueryLegend;
  }

  /**
   * Handles when a layer status changed on a layer config.
   *
   * @param sender - The layer config
   * @param layerStatusEvent - The new layer status
   */
  #handleLayerStatusChanged(sender: ConfigBaseClass, layerStatusEvent: LayerStatusChangedEvent): void {
    try {
      // Save to the store
      setStoreLayerStatus(this.getMapId(), sender.layerPath, layerStatusEvent.layerStatus);
    } catch (error: unknown) {
      // Log
      logger.logError('CAUGHT in handleLayerStatusChanged', sender.layerPath, error);
    }
  }

  /**
   * Handles when a layer style changes on a registered layer.
   *
   * @param sender - The layer which changed its styles
   * @param event - The layer style changed event
   */
  #handleLayerStyleChanged(sender: AbstractGVLayer, event: StyleChangedEvent): void {
    // Force query the legend as we have a new style
    this.#checkQueryLegend(sender, true);
  }

  /**
   * Handles when a layer style has been applied on a registered AbstractGVVector layer.
   *
   * @param sender - The layer which got its style applied
   * @param event - The StyleAppliedEvent
   */
  #handleStyleApplied(sender: AbstractGVVector, event: StyleAppliedEvent): void {
    // If the style has been applied
    if (event.styleApplied) {
      // Force query the legend as we have a new style
      this.#checkQueryLegend(sender, true);
    }
  }

  // #endregion PRIVATE METHODS

  // #region EVENTS

  /**
   * Emits a legend queried event to all handlers.
   *
   * @param event - The event to emit
   */
  #emitLegendQueried(event: LegendQueriedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLegendQueriedHandlers, event);
  }

  /**
   * Registers a one-shot legend queried event handler that resolves a promise.
   *
   * @param filter - Optional filter predicate to skip non-matching events without unsubscribing
   * @returns A promise that resolves with the legend queried event
   */
  onceLegendQueried(filter?: (event: LegendQueriedEvent) => boolean): Promise<LegendQueriedEvent> {
    return EventHelper.onceEventPromise(this.#onLegendQueriedHandlers, filter);
  }

  /**
   * Registers a legend queried event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onLegendQueried(callback: LegendQueriedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLegendQueriedHandlers, callback);
  }

  /**
   * Unregisters a legend queried event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLegendQueried(callback: LegendQueriedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLegendQueriedHandlers, callback);
  }

  // #endregion EVENTS
}

/** Event payload emitted when a layer legend has been queried successfully. */
export interface LegendQueriedEvent {
  /** The layer path for which the legend was queried. */
  layerPath: string;

  /** Optional legend schema tag. */
  legendSchemaTag?: TypeGeoviewLayerType;

  /** Optional style configuration associated with the legend. */
  styleConfig?: TypeLayerStyleConfig;

  /** Optional icons associated with the legend */
  icons?: TypeLegendLayerItem[];

  /** Optional items associated with the legend */
  items?: TypeLegendItem[];
}

/** Delegate for the {@link LegendQueriedEvent} handler. */
export type LegendQueriedDelegate = EventDelegateBase<LegendsLayerSet, LegendQueriedEvent, void>;
