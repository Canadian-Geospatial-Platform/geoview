import type { TypeFeatureInfoEntry } from '@/api/types/map-schema-types';
import { AbstractMapViewerController } from '@/core/controllers/base/abstract-map-viewer-controller';
import type { ControllerRegistry } from '@/core/controllers/base/controller-registry';
import type { MapViewer } from '@/geo/map/map-viewer';
/**
 * Controller responsible for details interactions and
 * bridging the details state with the UI domain.
 */
export declare class DetailsController extends AbstractMapViewerController {
    /**
     * Creates an instance of DetailsController.
     *
     * @param mapViewer - The map viewer instance to associate with this controller
     * @param controllerRegistry - The controller registry for accessing sibling controllers
     */
    constructor(mapViewer: MapViewer, controllerRegistry: ControllerRegistry);
    /**
     * Sets the selected layer path in the details panel.
     *
     * @param layerPath - The layer path to select
     */
    setSelectedLayerPath(layerPath: string): void;
    /**
     * Sets the layer data array batch layer path bypass in the details panel.
     *
     * @param layerPath - The layer path to set
     */
    setLayerDataArrayBatchLayerPathBypass(layerPath: string): void;
    /**
     * Adds a checked feature to the details panel.
     *
     * @param feature - The feature information entry to add as checked
     */
    addCheckedFeature(feature: TypeFeatureInfoEntry): void;
    /**
     * Removes a checked feature from the details panel.
     *
     * @param feature - The feature information entry to remove as checked, or 'all' to remove all checked features
     */
    removeCheckedFeature(feature: TypeFeatureInfoEntry | 'all'): void;
    /**
     * Deletes feature information from the details panel for a specific layer path.
     *
     * @param layerPath - The layer path for which to delete feature information
     */
    deleteFeatureInfo(layerPath: string): void;
}
//# sourceMappingURL=details-controller.d.ts.map