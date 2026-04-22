import type { TypeFeatureInfoEntry } from '@/api/types/map-schema-types';
import { AbstractMapViewerController } from '@/core/controllers/base/abstract-map-viewer-controller';
import type { ControllerRegistry } from '@/core/controllers/base/controller-registry';
import type { MapViewer } from '@/geo/map/map-viewer';
import {
  addStoreDetailsCheckedFeature,
  deleteStoreDetailsFeatureInfo,
  removeStoreDetailsCheckedFeature,
  setStoreDetailsLayerDataArrayBatchLayerPathBypass,
  setStoreDetailsSelectedLayerPath,
} from '@/core/stores/store-interface-and-intial-values/feature-info-state';

/**
 * Controller responsible for details interactions and
 * bridging the details state with the UI domain.
 */
export class DetailsController extends AbstractMapViewerController {
  /**
   * Creates an instance of DetailsController.
   *
   * @param mapViewer - The map viewer instance to associate with this controller
   * @param controllerRegistry - The controller registry for accessing sibling controllers
   */
  // GV Leave the constructor here, because we'll likely need it soon to inject dependencies.
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(mapViewer: MapViewer, controllerRegistry: ControllerRegistry) {
    super(mapViewer, controllerRegistry);
  }

  /**
   * Sets the selected layer path in the details panel.
   *
   * @param layerPath - The layer path to select
   */
  setSelectedLayerPath(layerPath: string): void {
    // Save in the store
    setStoreDetailsSelectedLayerPath(this.getMapId(), layerPath);
  }

  /**
   * Sets the layer data array batch layer path bypass in the details panel.
   *
   * @param layerPath - The layer path to set
   */
  setLayerDataArrayBatchLayerPathBypass(layerPath: string): void {
    // Save in the store
    setStoreDetailsLayerDataArrayBatchLayerPathBypass(this.getMapId(), layerPath);
  }

  /**
   * Adds a checked feature to the details panel.
   *
   * @param feature - The feature information entry to add as checked
   */
  addCheckedFeature(feature: TypeFeatureInfoEntry): void {
    // Save in the store
    addStoreDetailsCheckedFeature(this.getMapId(), feature);
  }

  /**
   * Removes a checked feature from the details panel.
   *
   * @param feature - The feature information entry to remove as checked, or 'all' to remove all checked features
   */
  removeCheckedFeature(feature: TypeFeatureInfoEntry | 'all'): void {
    // Save in the store
    removeStoreDetailsCheckedFeature(this.getMapId(), feature);
  }

  /**
   * Deletes feature information from the details panel for a specific layer path.
   *
   * @param layerPath - The layer path for which to delete feature information
   */
  deleteFeatureInfo(layerPath: string): void {
    // Save in the store
    deleteStoreDetailsFeatureInfo(this.getMapId(), layerPath);
  }
}
