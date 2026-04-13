// GV This file provides React hooks for accessing individual controllers from the ControllerContext.
// GV It imports only from controller-manager (type-only dependency on ControllerRegistry) to avoid
// GV circular dependencies between controller files and controller-registry.

import type { MapController } from '@/core/controllers/map-controller';
import type { LayerController } from '@/core/controllers/layer-controller';
import type { LayerCreatorController } from '@/core/controllers/layer-creator-controller';
import type { LayerSetController } from '@/core/controllers/layer-set-controller';
import type { UIController } from '@/core/controllers/ui-controller';
import type { DataTableController } from '@/core/controllers/data-table-controller';
import type { DetailsController } from '@/core/controllers/details-controller';
import type { DrawerController } from '@/core/controllers/drawer-controller';
import type { PluginController } from '@/core/controllers/plugin-controller';
import type { TimeSliderController } from '@/core/controllers/time-slider-controller';
import type { GeoChartController } from '@/core/controllers/geochart-controller';
import { useControllers } from '@/core/controllers/base/controller-manager';

/**
 * Hook to access the MapController from the controller context.
 *
 * @returns The map controller instance
 * @throws {Error} When used outside of a ControllerContext.Provider
 */
export function useMapController(): MapController {
  return useControllers().mapController;
}

/**
 * Hook to access the LayerController from the controller context.
 *
 * @returns The layer controller instance
 * @throws {Error} When used outside of a ControllerContext.Provider
 */
export function useLayerController(): LayerController {
  return useControllers().layerController;
}

/**
 * Hook to access the PluginController from the controller context.
 *
 * @returns The plugin controller instance
 * @throws {Error} When used outside of a ControllerContext.Provider
 */
export function usePluginController(): PluginController {
  return useControllers().pluginController;
}

/**
 * Hook to access the LayerCreatorController from the controller context.
 *
 * @returns The layer creator controller instance
 * @throws {Error} When used outside of a ControllerContext.Provider
 */
export function useLayerCreatorController(): LayerCreatorController {
  return useControllers().layerCreatorController;
}

/**
 * Hook to access the LayerSetController from the controller context.
 *
 * @returns The layer set controller instance
 * @throws {Error} When used outside of a ControllerContext.Provider
 */
export function useLayerSetController(): LayerSetController {
  return useControllers().layerSetController;
}

/**
 * Hook to access the UI controller from the controller context.
 *
 * @returns The UI controller instance
 * @throws {Error} When used outside of a ControllerContext.Provider
 */
export function useUIController(): UIController {
  return useControllers().uiController;
}

/**
 * Hook to access the DetailsController from the controller context.
 *
 * @returns The details controller instance
 * @throws {Error} When used outside of a ControllerContext.Provider
 */
export function useDetailsController(): DetailsController {
  return useControllers().detailsController;
}

/**
 * Hook to access the DataTableController from the controller context.
 *
 * @returns The data table controller instance
 * @throws {Error} When used outside of a ControllerContext.Provider
 */
export function useDataTableController(): DataTableController {
  return useControllers().dataTableController;
}

/**
 * Hook to access the DrawerController from the controller context.
 *
 * @returns The drawer controller instance
 * @throws {Error} When used outside of a ControllerContext.Provider
 * @throws {Error} When the Drawer plugin is not configured
 */
export function useDrawerController(): DrawerController {
  const controller = useControllers().drawerController;
  if (!controller) throw new Error('useDrawerController must be used with an initialized drawer plugin state');
  return controller;
}

/**
 * Hook to access the TimeSliderController from the controller context.
 *
 * @returns The time slider controller instance
 * @throws {Error} When used outside of a ControllerContext.Provider
 * @throws {Error} When the TimeSlider plugin is not configured
 */
export function useTimeSliderController(): TimeSliderController {
  const controller = useControllers().timeSliderController;
  if (!controller) throw new Error('useTimeSliderController must be used with an initialized time slider plugin state');
  return controller;
}

/**
 * Hook to optionally access the TimeSliderController from the controller context.
 *
 * Unlike `useTimeSliderController`, this hook does not throw when the TimeSlider
 * plugin is not configured. Use this in shared components that may or may not
 * have the time slider plugin active.
 *
 * @returns The time slider controller instance, or undefined if the plugin is not configured
 * @throws {Error} When used outside of a ControllerContext.Provider
 */
export function useTimeSliderControllerIfExists(): TimeSliderController | undefined {
  return useControllers().timeSliderController;
}

/**
 * Hook to access the GeoChartController from the controller context.
 *
 * @returns The geo chart controller instance
 * @throws {Error} When used outside of a ControllerContext.Provider
 * @throws {Error} When the GeoChart plugin is not configured
 */
export function useGeoChartController(): GeoChartController {
  const controller = useControllers().geoChartController;
  if (!controller) throw new Error('useGeoChartController must be used with an initialized geo chart plugin state');
  return controller;
}

/**
 * Hook to optionally access the GeoChartController from the controller context.
 *
 * Unlike `useGeoChartController`, this hook does not throw when the GeoChart
 * plugin is not configured. Use this in shared components that may or may not
 * have the geo chart plugin active.
 *
 * @returns The geo chart controller instance, or undefined if the plugin is not configured
 * @throws {Error} When used outside of a ControllerContext.Provider
 */
export function useGeoChartControllerIfExists(): GeoChartController | undefined {
  return useControllers().geoChartController;
}
