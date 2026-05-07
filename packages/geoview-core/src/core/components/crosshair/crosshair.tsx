import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { Box, Fade, Typography } from '@/ui';

import { getSxClasses } from './crosshair-style';
import { CrosshairIcon } from './crosshair-icon';
import { useStoreAppIsCrosshairsActive } from '@/core/stores/states/app-state';
import { getStoreMapPointerPosition, useStoreMapZoom } from '@/core/stores/states/map-state';
import { getStoreDrawerIsEditing, getStoreDrawerIsDrawing } from '@/core/stores/store-interface-and-intial-values/drawer-state';
import { logger } from '@/core/utils/logger';
import { useEventListener } from '@/core/components/common/hooks/use-event-listener';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import { useDrawerControllerIfExists, useLayerSetController, useMapController, useUIController } from '@/core/controllers/use-controllers';

/** Properties for the Crosshair component. */
type CrosshairProps = {
  mapTargetElement: HTMLElement;
};

/**
 * Renders a crosshair when the map is focused with the keyboard so the user can click on the map.
 *
 * Memoized because the single prop is a stable DOM element reference that maintains identity across parent renders.
 *
 * @param props - Crosshair properties containing the map target element
 * @returns The crosshair component, or null if inactive
 */
export const Crosshair = memo(function Crosshair({ mapTargetElement }: CrosshairProps): JSX.Element | null {
  logger.logTraceRender('components/crosshair/crosshair');

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  //  Store
  const mapId = useStoreGeoViewMapId();
  const mapZoom = useStoreMapZoom();
  const isCrosshairsActive = useStoreAppIsCrosshairsActive();
  const uiController = useUIController();
  const mapController = useMapController();
  const drawerController = useDrawerControllerIfExists();
  const layerSetController = useLayerSetController();

  // Pan delta for keyboard pan interactions
  const panDelta = useRef(128);

  // AbortController ref - aborts any in-flight coordinate info fetch on re-click
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Modifies the pixelDelta value for keyboard pan on Shift+Arrow up or down.
   */
  const managePanDelta = useCallback(
    (event: HTMLElementEventMap[keyof HTMLElementEventMap]): void => {
      if (!isCrosshairsActive || !(event instanceof KeyboardEvent)) return;

      if ((event.key === 'ArrowDown' && event.shiftKey) || (event.key === 'ArrowUp' && event.shiftKey)) {
        panDelta.current = event.key === 'ArrowDown' ? Math.max(10, panDelta.current - 10) : panDelta.current + 10;

        uiController.setMapKeyboardPanInteractions(panDelta.current);
      }
    },
    [isCrosshairsActive, uiController]
  );

  /**
   * Handles zoom controls via Ctrl+Arrow keys.
   */
  const handleZoomControls = useCallback(
    (event: HTMLElementEventMap[keyof HTMLElementEventMap]): void => {
      if (!isCrosshairsActive || !(event instanceof KeyboardEvent)) return;

      // Ctrl+Up: Zoom in
      if (event.key === 'ArrowUp' && event.ctrlKey) {
        event.preventDefault();
        mapController.zoomMapAndForget(mapZoom + 1);
      }
      // Ctrl+Down: Zoom out
      else if (event.key === 'ArrowDown' && event.ctrlKey) {
        event.preventDefault();
        mapController.zoomMapAndForget(mapZoom - 1);
      }
    },
    [isCrosshairsActive, mapController, mapZoom]
  );

  /**
   * Handles Enter and Space key for crosshair
   */
  const handleCrosshairInteraction = useCallback(
    (event: HTMLElementEventMap[keyof HTMLElementEventMap]): void => {
      if (!isCrosshairsActive || !(event instanceof KeyboardEvent)) {
        return;
      }

      const currentPointerPosition = getStoreMapPointerPosition(mapId);
      if (!currentPointerPosition) return;

      // Check drawer state if drawer plugin is loaded
      if (!drawerController) {
        // Drawer not available - only handle default Enter behavior
        if (event.key === 'Enter') {
          abortControllerRef.current?.abort();
          const controller = new AbortController();
          abortControllerRef.current = controller;
          mapController.setClickCoordinates(currentPointerPosition, controller.signal);
        }
        return;
      }

      // Drawer is available - check if we're in drawing or editing mode
      const isDrawerDrawing = getStoreDrawerIsDrawing(mapId);
      const isDrawerEditing = getStoreDrawerIsEditing(mapId);

      if (isDrawerDrawing) {
        // DRAWING MODE
        if ((event.key === 'Enter' && event.shiftKey) || (event.key === ' ' && event.shiftKey)) {
          // Shift+Enter or Shift+Space: Finish drawing
          event.preventDefault();
          drawerController.finishCurrentDrawing();
        } else if (event.key === 'Enter' || event.key === ' ') {
          // Enter or Space: Add vertex
          event.preventDefault();
          drawerController.addCoordinateToDrawing(currentPointerPosition.projected);
        }
      } else if (isDrawerEditing) {
        // EDITING MODE
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();

          // If actively moving a handle
          if (drawerController.isHandleGrabbed()) {
            // DROP: Apply transformation from grab coordinate to current coordinate
            drawerController.applyGrabbedTransform(currentPointerPosition.projected);
          } else {
            // GRAB: Check what's at the crosshair
            const grabbed = drawerController.grabHandleForKeyboard(currentPointerPosition.projected);
            if (!grabbed) {
              // No handle - try to select a feature instead
              drawerController.handleEditingAtCoordinate(currentPointerPosition.projected);
            }
          }
        } else if (event.key === 'Escape') {
          // CANCEL: Release the grab without applying transformation
          event.preventDefault();
          drawerController.cancelGrabbedTransform();
        }
      } else if (event.key === 'Enter' || event.key === ' ') {
        // Not in draw or edit mode
        // Default behavior: open details panel
        abortControllerRef.current?.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;
        mapController.setClickCoordinates(currentPointerPosition, controller.signal);
      }
    },
    [isCrosshairsActive, mapId, mapController, drawerController]
  );

  /**
   * Aborts any in-flight coordinate info request on unmount.
   */
  useEffect(() => {
    return (): void => {
      abortControllerRef.current?.abort();
      drawerController?.cancelGrabbedTransform();
    };
  }, [drawerController]);

  /**
   * Clears hover tooltip when crosshair becomes active.
   */
  useEffect(() => {
    if (isCrosshairsActive) {
      layerSetController.hoverFeatureInfoLayerSet.clearResults();
    }
  }, [isCrosshairsActive, layerSetController]);

  // Event listeners
  useEventListener<HTMLElement>('keydown', handleCrosshairInteraction, mapTargetElement, isCrosshairsActive);
  useEventListener<HTMLElement>('keydown', managePanDelta, mapTargetElement, isCrosshairsActive);
  useEventListener<HTMLElement>('keydown', handleZoomControls, mapTargetElement, isCrosshairsActive);

  return (
    <Box sx={{ ...sxClasses.crosshairContainer, visibility: isCrosshairsActive ? 'visible' : 'hidden' }}>
      <Fade in={isCrosshairsActive}>
        <Box sx={sxClasses.crosshairIcon}>
          <CrosshairIcon />
        </Box>
      </Fade>
      <Box sx={sxClasses.crosshairInfo}>
        <Typography dangerouslySetInnerHTML={{ __html: t('mapctrl.crosshair') }} />
      </Box>
    </Box>
  );
});
