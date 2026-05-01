import type {
  ConfigBaseClass,
  LayerStatusChangedDelegate,
  LayerStatusChangedEvent,
} from '@/api/config/validation-classes/config-base-class';
import { logger } from '@/core/utils/logger';
import type { TypeLayerStatus } from '@/api/types/layer-schema-types';
import { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';
import type { TypeLegendItem, TypeLegendLayerItem } from '@/core/components/layers/types';
import { AbstractLayerSet } from '@/geo/layer/layer-sets/abstract-layer-set';
import {
  deleteStoreLayerFromLegendLayers,
  getStoreLayerLegendQueryStatus,
  setStoreLayerStatus,
  setStoreLegendQueryStatus,
  type LegendQueryStatus,
  type TypeLegend,
} from '@/core/stores/store-interface-and-intial-values/layer-state';
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
  queryLegend(layer: AbstractBaseGVLayer, forced: boolean = false): void {
    // Trigger the check/query process
    this.#checkQueryLegend(layer, forced);
  }

  // #endregion PUBLIC METHODS

  // #region PRIVATE METHODS

  /**
   * Processes action when the layer status changes.
   *
   * @param layerConfig - The layer config
   * @param layerStatus - The new layer status
   */
  #processLayerStatusChanged(layerPath: string, layerStatus: TypeLayerStatus, layer: AbstractBaseGVLayer | undefined): void {
    // Save to the store
    this.#propagateToStoreLayerStatus(layerPath, layerStatus);

    // Check if ready to query legend
    this.#checkQueryLegend(layer, false);
  }

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
      // Propagate to the store about the querying happening
      this.#propagateToStoreLegendQueryStatus(layerPath, 'querying', undefined);

      // Query the legend
      const legendPromise = layer.queryLegend();

      // Whenever the legend response comes in
      legendPromise
        ?.then((legend: TypeLegend | null | undefined) => {
          // If legend received
          if (legend) {
            // Check for possible number of icons and set icon cache size
            this.mapViewer.updateIconImageCache(legend);

            // Propagate to the store once the legend is received
            this.#propagateToStoreLegendQueryStatus(layerPath, 'queried', legend);
          }
        })
        .catch((error: unknown) => {
          // Log
          logger.logPromiseFailed('legendPromise in #checkQueryLegend in LegendsLayerSet', error);
        });
    }
  }

  /**
   * Propagates the layer status to the store.
   *
   * @param layerPath - The layer path to propagate the status for
   * @param layerStatus - The layer status to propagate
   */
  #propagateToStoreLayerStatus(layerPath: string, layerStatus: TypeLayerStatus): void {
    // Propagate
    setStoreLayerStatus(this.getMapId(), layerPath, layerStatus);
  }

  /**
   * Propagates the legend query status to the store.
   *
   * @param layerPath - The layer path to propagate the legend query status for
   * @param queryStatus - The legend query status to propagate
   * @param data - The legend data to propagate
   */
  #propagateToStoreLegendQueryStatus(layerPath: string, queryStatus: LegendQueryStatus, data: TypeLegend | undefined): void {
    // If any data type
    let icons: TypeLegendLayerItem[] = [];
    let items: TypeLegendItem[] = [];
    if (data?.type) {
      // Calculate icons and items
      icons = GeoUtilities.getLayerIconImage(data?.type, data) ?? [];
      items = GeoUtilities.getLayerItemsFromIcons(data.type, icons);
    }

    // Propagate
    setStoreLegendQueryStatus(this.getMapId(), layerPath, queryStatus, data?.type, icons, items, data?.styleConfig);
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
   * @param layerConfig - The layer config
   * @param layerStatusEvent - The new layer status
   */
  #handleLayerStatusChanged(layerConfig: ConfigBaseClass, layerStatusEvent: LayerStatusChangedEvent): void {
    try {
      // Check if the geoview layer exists
      const layer = this.layerDomain.getGeoviewLayerIfExists(layerConfig.layerPath);

      // Process a layer status changed
      this.#processLayerStatusChanged(layerConfig.layerPath, layerStatusEvent.layerStatus, layer);
    } catch (error: unknown) {
      // Log
      logger.logError('CAUGHT in handleLayerStatusChanged', layerConfig.layerPath, error);
    }
  }

  /**
   * Handles when a layer style changes on a registered layer.
   *
   * @param layer - The layer which changed its styles
   * @param event - The layer style changed event
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  #handleLayerStyleChanged(layer: AbstractGVLayer, event: StyleChangedEvent): void {
    // Force query the legend as we have a new style
    this.#checkQueryLegend(layer, true);
  }

  /**
   * Handles when a layer style has been applied on a registered AbstractGVVector layer.
   *
   * @param layer - The layer which got its style applied
   * @param event - The StyleAppliedEvent
   */
  #handleStyleApplied(layer: AbstractGVVector, event: StyleAppliedEvent): void {
    // If the style has been applied
    if (event.styleApplied) {
      // Force query the legend as we have a new style
      this.#checkQueryLegend(layer, true);
    }
  }

  // #endregion PRIVATE METHODS
}
