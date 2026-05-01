import type { TypeFeatureInfoEntry } from '@/api/types/map-schema-types';
import { AbstractMapViewerController } from '@/core/controllers/base/abstract-map-viewer-controller';
import type { ControllerRegistry } from '@/core/controllers/base/controller-registry';
import {
  addOrUpdateStoreDataTableFilter,
  getStoreDataTableSelectedLayerPath,
  getStoreDataTableMapFilteredRecord,
  setStoreDataTableColumnFiltersRecord,
  setStoreDataTableColumnVisibilityRecord,
  setStoreDataTableColumnsFiltersVisibility,
  setStoreDataTableColumnFilterModesRecord,
  setStoreDataTableFilterDataToExtent,
  setStoreDataTableMapFilteredRecord,
  setStoreDataTableGlobalFilterRecord,
  setStoreDataTableRowsFilteredRecord,
  setStoreDataTableSelectedFeature,
  setStoreDataTableSelectedLayerPath,
  type TypeColumnFiltersState,
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
   * @param controllerRegistry - The controller registry for accessing sibling controllers
   */
  // GV Leave the constructor here, because we'll likely need it soon to inject dependencies.
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(mapViewer: MapViewer, controllerRegistry: ControllerRegistry) {
    super(mapViewer, controllerRegistry);
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
    const filter = getStoreDataTableMapFilteredRecord(this.getMapId(), layerPath) ? filterStrings : '';

    // Get the layer
    const layer = this.getControllersRegistry().layerController.getGeoviewLayerRegular(layerPath);

    // Set the filters on the data on the layer
    layer.setLayerFiltersData(filter);

    // Save in the store
    addOrUpdateStoreDataTableFilter(this.getMapId(), layerPath, filter);
  }

  /**
   * Sets the selected layer path in the store, which determines which layer's data is displayed in the data table.
   *
   * @param layerPath - The path of the layer to select
   */
  setSelectedLayerPath(layerPath: string): void {
    // Save in the store
    setStoreDataTableSelectedLayerPath(this.getMapId(), layerPath);
  }

  /**
   * Sets the filtered entry state for a specific layer in the data table, which determines whether map filters are applied to that layer.
   *
   * @param layerPath - The path of the layer to update
   * @param mapFiltered - A boolean indicating whether the layer should be filtered based on the data table filters
   */
  setMapFilteredRecord(layerPath: string, mapFiltered: boolean): void {
    // Save in the store
    setStoreDataTableMapFilteredRecord(this.getMapId(), mapFiltered, layerPath);
  }

  /**
   * Sets the global filter value for a specific layer in the data table, which determines the global filter applied to that layer.
   *
   * @param layerPath - The path of the layer to update
   * @param globalFilterValue - The global filter value to set for the layer
   */
  setGlobalFilterRecord(layerPath: string, globalFilterValue: string): void {
    // Save in the store
    setStoreDataTableGlobalFilterRecord(this.getMapId(), globalFilterValue, layerPath);
  }

  /**
   * Sets the column filters state for a specific layer in the data table, which determines the filters applied to individual columns for that layer.
   *
   * @param layerPath - The path of the layer to update
   * @param columnFilters - The column filters state to set for the layer
   */
  setColumnFiltersRecord(layerPath: string, columnFilters: TypeColumnFiltersState): void {
    // Save in the store
    setStoreDataTableColumnFiltersRecord(this.getMapId(), columnFilters, layerPath);
  }

  /**
   * Sets the column visibility state for a specific layer in the data table.
   *
   * @param layerPath - The path of the layer to update
   * @param columnVisibility - A record mapping column ids to their visibility state
   */
  setColumnVisibilityRecord(layerPath: string, columnVisibility: Record<string, boolean>): void {
    // Save in the store
    setStoreDataTableColumnVisibilityRecord(this.getMapId(), columnVisibility, layerPath);
  }

  /**
   * Sets the column filter modes for a specific layer in the data table, which determines how filters are applied to individual columns for that layer.
   *
   * @param layerPath - The path of the layer to update
   * @param columnFilterModes - The column filter modes to set for the layer
   */
  setColumnFilterModesRecord(layerPath: string, columnFilterModes: Record<string, string>): void {
    // Save in the store
    setStoreDataTableColumnFilterModesRecord(this.getMapId(), columnFilterModes, layerPath);
  }

  /**
   * Sets the visibility of column filters for a specific layer in the data table, which determines whether the column filter UI is shown for that layer.
   *
   * @param layerPath - The path of the layer to update
   * @param visible - A boolean indicating whether the column filter UI should be visible for the layer
   */
  setColumnsFiltersVisibility(layerPath: string, visible: boolean): void {
    // Save in the store
    setStoreDataTableColumnsFiltersVisibility(this.getMapId(), visible, layerPath);
  }

  /**
   * Sets the selected feature in the data table, which determines which feature's details are displayed.
   *
   * @param feature - The feature to select
   */
  setSelectedFeature(feature: TypeFeatureInfoEntry): void {
    // Save in the store
    setStoreDataTableSelectedFeature(this.getMapId(), feature);
  }

  /**
   * Sets the number of rows filtered for a specific layer in the data table, which determines how many rows are
   * currently filtered for that layer.
   *
   * @param layerPath - The path of the layer to update
   * @param rows - The number of rows filtered for the layer
   */
  setRowsFilteredRecord(layerPath: string, rows: number): void {
    // Save in the store
    setStoreDataTableRowsFilteredRecord(this.getMapId(), rows, layerPath);
  }

  /**
   * Sets whether to filter data to the map extent for a specific layer in the data table, which determines whether the data table is filtered based on the current map extent for that layer.
   *
   * @param layerPath - The path of the layer to update
   * @param filterDataToExtent - A boolean indicating whether to filter data to the map extent for the layer
   */
  setFilterDataToExtent(layerPath: string, filterDataToExtent: boolean): void {
    // Save in the store
    setStoreDataTableFilterDataToExtent(this.getMapId(), filterDataToExtent, layerPath);
  }

  // #endregion PUBLIC METHODS

  // #region DOMAIN HANDLERS
  // GV Eventually, these should be moved to a store adaptor or similar construct that directly connects the domain to the store without going through the controller
  // GV.CONT but for now this allows us to keep domain-store interactions in one place and call application-level processes as needed during migration.

  // #endregion DOMAIN HANDLERS

  // #region STATIC METHODS

  // #endregion STATIC METHODS
}
