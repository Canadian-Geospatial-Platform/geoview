import { AbstractMapViewerController } from '@/core/controllers/base/abstract-map-viewer-controller';
import { useControllers } from '@/core/controllers/base/controller-manager';
import {
  addOrUpdateStoreTableFilter,
  getStoreDataTableSelectedLayerPath,
  getStoreMapFilteredRecord,
} from '@/core/stores/store-interface-and-intial-values/data-table-state';
import type { MapViewer } from '@/geo/map/map-viewer';

/**
 * Controller responsible for Data Table interactions.
 */
export class DataTableController extends AbstractMapViewerController {
  /**
   * Creates an instance of DataTableController.
   *
   * @param mapViewer - The map viewer instance to associate with this controller
   */
  // GV Leave the constructor here, because we'll likely need it soon to inject dependencies.
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(mapViewer: MapViewer) {
    super(mapViewer);
  }

  // #region OVERRIDES

  // #endregion OVERRIDES

  // #region PUBLIC METHODS

  /**
   * Applies the current map filter strings to the selected data-table layer.
   *
   * If the layer already has a filtered record, the provided filter strings are applied;
   * otherwise the filter is cleared.
   *
   * @param filterStrings - The filter expression to apply
   */
  applyMapFilters(filterStrings: string): void {
    const layerPath = getStoreDataTableSelectedLayerPath(this.getMapId());
    const filter = getStoreMapFilteredRecord(this.getMapId(), layerPath) ? filterStrings : '';
    addOrUpdateStoreTableFilter(this.getMapId(), layerPath, filter);
    this.getControllersRegistry().mapController.applyLayerFilters(layerPath);
  }

  // #endregion PUBLIC METHODS

  // #region DOMAIN HANDLERS
  // GV Eventually, these should be moved to a store adaptor or similar construct that directly connects the domain to the store without going through the controller
  // GV.CONT but for now this allows us to keep domain-store interactions in one place and call application-level processes as needed during migration.

  // #endregion DOMAIN HANDLERS

  // #region STATIC METHODS

  // #endregion STATIC METHODS
}

/**
 * Hook to access the DataTableController from the controller context.
 *
 * @returns The data table controller instance
 * @throws {Error} When used outside of a ControllerContext.Provider.
 */
export function useDataTableController(): DataTableController {
  return useControllers().dataTableController;
}
