import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { AbstractMapViewerController } from '@/core/controllers/base/abstract-map-viewer-controller';
import { useControllers } from '@/core/controllers/controller-manager';
import { setStoreLayerQueryable } from '@/core/stores/store-interface-and-intial-values/layer-state';
import type { DomainLayerQueryableChangedDelegate, DomainLayerQueryableChangedEvent, LayerDomain } from '@/core/domains/layer-domain';
import type { MapViewer } from '@/geo/map/map-viewer';
import type { FeatureInfoLayerSet } from '@/geo/layer/layer-sets/feature-info-layer-set';

/**
 * LayerController class that extends the AbstractMapViewerController and provides methods to interact with map layers.
 */
export class LayerController extends AbstractMapViewerController {
  /** The Layer Domain instance associated with this controller */
  #layerDomain: LayerDomain;

  /** The Layer State Adaptor used to interact with the layer state store */
  // TODO: STATE-ADAPTOR - TO BE IMPLEMENTED
  // #layerStateAdaptor: LayerStateAdaptor;

  /** Feature info layer set associated to the map */
  featureInfoLayerSet?: FeatureInfoLayerSet;

  /** Keep a bounded reference to the handle layer queryable changed */
  #boundedHandleLayerQueryableChanged: DomainLayerQueryableChangedDelegate;

  /**
   * Creates an instance of LayerController.
   *
   * @param mapViewer - The map viewer instance to associate with this controller.
   * @param layerDomain - The layer domain instance to associate with this controller.
   */
  constructor(mapViewer: MapViewer, layerDomain: LayerDomain) {
    super(mapViewer);

    // Keep the domain internally
    this.#layerDomain = layerDomain;

    // Keep a bounded reference to the handle layer queryable changed
    this.#boundedHandleLayerQueryableChanged = this.#handleLayerQueryableChanged.bind(this);
  }

  /**
   * Hooks the feature info layer set.
   *
   * @deprecated Temporary function during migration process
   */
  temporaryHookFeatureInfoLayerSet(featureInfoLayerSet: FeatureInfoLayerSet): void {
    this.featureInfoLayerSet = featureInfoLayerSet;
  }

  /**
   * Hooks layer domain listeners.
   */
  protected override onHook(): void {
    // Listens when the layer queryable state is changed in the Layer domain and updates the store accordingly
    this.#layerDomain.onLayerQueryableChanged(this.#boundedHandleLayerQueryableChanged);
  }

  /**
   * Unhooks layer domain listeners.
   */
  protected override onUnhook(): void {
    // Unhooks when the layer queryable state is changed in the Layer domain and updates the store accordingly
    this.#layerDomain.offLayerQueryableChanged(this.#boundedHandleLayerQueryableChanged);
  }

  /**
   * Sets the queryable property of the layer indicated by the given layer path.
   *
   * @param layerPath - The layer path to set the queryable property
   * @param queryable - The value to set for the queryable property
   */
  setLayerQueryable(layerPath: string, queryable: boolean): void {
    // Get the layer
    const layer = this.#layerDomain.getGeoviewLayerRegular(layerPath);

    // Redirect
    layer.setQueryable(queryable);
  }

  // #region DOMAIN HANDLERS

  #handleLayerQueryableChanged(sender: LayerDomain, event: DomainLayerQueryableChangedEvent): void {
    // Save in store
    setStoreLayerQueryable(this.getMapId(), event.layer.getLayerPath(), event.queryable);

    // Redirect
    MapEventProcessor.setMapLayerQueryable(this.getMapId(), event.layer.getLayerPath(), event.queryable);

    // If not queryable
    if (!event.queryable) {
      // Clear the results when turning the queryable to false
      this.featureInfoLayerSet?.clearResults(event.layer.getLayerPath());
    }
  }

  // #endregion DOMAIN HANDLERS
}

/**
 * Layer Controller hook to access the layer controller from the context.
 *
 * @returns The layer controller instance from the context.
 * @throws {Error} When used outside of a ControllerContext.Provider.
 */
export function useLayerController(): LayerController {
  return useControllers().layerController;
}
