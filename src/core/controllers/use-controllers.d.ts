import type { MapController } from '@/core/controllers/map-controller';
import type { LayerController } from '@/core/controllers/layer-controller';
import type { LayerCreatorController } from '@/core/controllers/layer-creator-controller';
import type { LayerSetController } from '@/core/controllers/layer-set-controller';
import type { UIController } from '@/core/controllers/ui-controller';
import type { DataTableController } from '@/core/controllers/data-table-controller';
import type { DrawerController } from '@/core/controllers/drawer-controller';
import type { PluginController } from '@/core/controllers/plugin-controller';
import type { TimeSliderController } from '@/core/controllers/time-slider-controller';
/**
 * Hook to access the MapController from the controller context.
 *
 * @returns The map controller instance
 * @throws {Error} When used outside of a ControllerContext.Provider
 */
export declare function useMapController(): MapController;
/**
 * Hook to access the LayerController from the controller context.
 *
 * @returns The layer controller instance
 * @throws {Error} When used outside of a ControllerContext.Provider
 */
export declare function useLayerController(): LayerController;
/**
 * Hook to access the PluginController from the controller context.
 *
 * @returns The plugin controller instance
 * @throws {Error} When used outside of a ControllerContext.Provider
 */
export declare function usePluginController(): PluginController;
/**
 * Hook to access the LayerCreatorController from the controller context.
 *
 * @returns The layer creator controller instance
 * @throws {Error} When used outside of a ControllerContext.Provider
 */
export declare function useLayerCreatorController(): LayerCreatorController;
/**
 * Hook to access the LayerSetController from the controller context.
 *
 * @returns The layer set controller instance
 * @throws {Error} When used outside of a ControllerContext.Provider
 */
export declare function useLayerSetController(): LayerSetController;
/**
 * Hook to access the UI controller from the controller context.
 *
 * @returns The UI controller instance
 * @throws {Error} When used outside of a ControllerContext.Provider
 */
export declare function useUIController(): UIController;
/**
 * Hook to access the DataTableController from the controller context.
 *
 * @returns The data table controller instance
 * @throws {Error} When used outside of a ControllerContext.Provider
 */
export declare function useDataTableController(): DataTableController;
/**
 * Hook to access the DrawerController from the controller context.
 *
 * @returns The drawer controller instance
 * @throws {Error} When used outside of a ControllerContext.Provider
 * @throws {Error} When the Drawer plugin is not configured
 */
export declare function useDrawerController(): DrawerController;
/**
 * Hook to access the TimeSliderController from the controller context.
 *
 * @returns The time slider controller instance
 * @throws {Error} When used outside of a ControllerContext.Provider
 * @throws {Error} When the TimeSlider plugin is not configured
 */
export declare function useTimeSliderController(): TimeSliderController;
//# sourceMappingURL=use-controllers.d.ts.map