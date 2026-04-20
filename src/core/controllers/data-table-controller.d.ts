import { AbstractMapViewerController } from '@/core/controllers/base/abstract-map-viewer-controller';
import type { MapViewer } from '@/geo/map/map-viewer';
/**
 * Controller responsible for Data Table interactions.
 */
export declare class DataTableController extends AbstractMapViewerController {
    /**
     * Creates an instance of DataTableController.
     *
     * @param mapViewer - The map viewer instance to associate with this controller
     */
    constructor(mapViewer: MapViewer);
    /**
     * Applies the current map filter strings to the selected data-table layer.
     *
     * If the layer already has a filtered record, the provided filter strings are applied;
     * otherwise the filter is cleared.
     *
     * @param filterStrings - The filter expression to apply
     */
    applyMapFilters(filterStrings: string): void;
}
//# sourceMappingURL=data-table-controller.d.ts.map