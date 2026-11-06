import { useCallback } from 'react';
import { useStoreUIActiveAppBarTab } from '@/core/stores/states/ui-state';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import { useMapController } from '@/core/controllers/use-controllers';
import { MapFitPadding } from '@/core/utils/map-fit-padding';
import type { GVFitOptions } from '@/core/utils/constant';

/**
 * Custom hook that provides map fit options for zooming to a feature, keeping it out of the open app-bar panel.
 *
 * Details and Data Table can live in the app bar or the footer bar, so the open app-bar panel (if any) is read
 * from the store. The STAC browser only lives in the app bar, so it calls `MapFitPadding.getAppBarPanelPadding` directly.
 *
 * @returns A getter of the fit options to pass when zooming
 */
export function useAppBarPanelFitOptions(): () => GVFitOptions {
  // Hooks
  const mapId = useStoreGeoViewMapId();
  const mapController = useMapController();
  const { tabId, isOpen } = useStoreUIActiveAppBarTab();

  return useCallback((): GVFitOptions => {
    const padding =
      isOpen && tabId ? MapFitPadding.getAppBarPanelPadding(mapId, tabId, mapController.getMapSize()) : MapFitPadding.getDefaultPadding();
    return { padding };
  }, [isOpen, tabId, mapId, mapController]);
}
