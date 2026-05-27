import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { Box, Fade, Typography } from '@/ui';

import { getSxClasses } from './crosshair-style';
import { CrosshairIcon } from './crosshair-icon';
import { useStoreAppIsCrosshairsActive } from '@/core/stores/states/app-state';
import { getStoreMapPointerPosition, useStoreMapZoom } from '@/core/stores/states/map-state';
import { getStoreDrawerIsEditing, getStoreDrawerIsDrawing, getStoreDrawerSelectedDrawingType } from '@/core/stores/states/drawer-state';
import { logger } from '@/core/utils/logger';
import { useEventListener } from '@/core/components/common/hooks/use-event-listener';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import { useDrawerControllerIfExists, useLayerSetController, useMapController, useUIController } from '@/core/controllers/use-controllers';
import type { TypeMapMouseInfo } from '@/api/types/map-schema-types';

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
  const handlePanDelta = useCallback(
    (event: HTMLElementEventMap[keyof HTMLElementEventMap]): void => {
      if (!isCrosshairsActive || !(event instanceof KeyboardEvent)) return;

      // Prevent interactions when typing in input fields
      const { activeElement } = document;
      if (
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        (activeElement as HTMLElement).isContentEditable
      ) {
        return;
      }

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
        event.stopPropagation();
        mapController.zoomMapAndForget(mapZoom + 1);
      }
      // Ctrl+Down: Zoom out
      else if (event.key === 'ArrowDown' && event.ctrlKey) {
        event.preventDefault();
        event.stopPropagation();
        mapController.zoomMapAndForget(mapZoom - 1);
      }
    },
    [isCrosshairsActive, mapController, mapZoom]
  );

  /**
   * Handles the universal Shift + Click logic before falling back to other modes.
   */
  const handleShiftClick = useCallback(
    (event: KeyboardEvent, currentPointerPosition: TypeMapMouseInfo): boolean => {
      if (!drawerController || !(event.key === 'Enter' || event.key === ' ')) {
        return false; // Not a Shift+Click interaction
      }

      if (event.shiftKey) {
        const handled = drawerController.handleShiftClickAtCoordinate(currentPointerPosition.projected);
        if (handled) {
          event.preventDefault();
          event.stopPropagation();
          return true; // Handled
        }
      }
      return false; // Not handled
    },
    [drawerController]
  );

  /**
   * Handles the default interaction when no drawer is present.
   */
  const handleDefaultInteraction = useCallback(
    (event: KeyboardEvent, currentPointerPosition: TypeMapMouseInfo): void => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        event.stopPropagation();

        abortControllerRef.current?.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;
        mapController.setClickCoordinates(currentPointerPosition, controller.signal);
      }
    },
    [mapController]
  );

  /**
   * Handles logic for Text Drawing Mode.
   */
  const handleTextDrawingMode = useCallback(
    (event: KeyboardEvent, currentPointerPosition: TypeMapMouseInfo): void => {
      const { activeElement } = document;
      if (activeElement instanceof HTMLElement && activeElement.isContentEditable) {
        return;
      }

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        event.stopPropagation();
        if (drawerController?.isHandleGrabbed()) {
          drawerController.applyGrabbedTransform(currentPointerPosition.projected);
        } else {
          const grabbed = drawerController?.grabHandleForKeyboard(currentPointerPosition.projected);
          if (!grabbed) {
            drawerController?.handleEditingAtCoordinate(currentPointerPosition.projected);
          }
        }
      } else if (event.key === 'Escape') {
        event.preventDefault();
        drawerController?.cancelGrabbedTransform();
      }
    },
    [drawerController]
  );

  /**
   * Handles logic for Drawing Mode within the drawer.
   */
  const handleDrawingMode = useCallback(
    (event: KeyboardEvent, currentPointerPosition: TypeMapMouseInfo): void => {
      const selectedDrawingType = getStoreDrawerSelectedDrawingType(mapId);

      if (selectedDrawingType === 'Text') {
        handleTextDrawingMode(event, currentPointerPosition);
      } else if ((event.key === 'Enter' && event.shiftKey) || (event.key === ' ' && event.shiftKey)) {
        event.preventDefault();
        event.stopPropagation();
        drawerController?.finishCurrentDrawing();
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        event.stopPropagation();
        drawerController?.addCoordinateToDrawing(currentPointerPosition.projected);
      }
    },
    [mapId, handleTextDrawingMode, drawerController]
  );

  /**
   * Handles logic for Editing Mode within the drawer.
   */
  const handleEditingMode = useCallback(
    (event: KeyboardEvent, currentPointerPosition: TypeMapMouseInfo): void => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        event.stopPropagation();
        if (drawerController?.isHandleGrabbed()) {
          drawerController.applyGrabbedTransform(currentPointerPosition.projected);
        } else {
          const grabbed = drawerController?.grabHandleForKeyboard(currentPointerPosition.projected);
          if (!grabbed) {
            drawerController?.handleEditingAtCoordinate(currentPointerPosition.projected);
          }
        }
      } else if (event.key === 'Escape') {
        event.preventDefault();
        drawerController?.cancelGrabbedTransform();
      }
    },
    [drawerController]
  );

  /**
   * Handles drawer-specific interactions (drawing, editing, etc.).
   */
  const handleDrawerInteraction = useCallback(
    (event: KeyboardEvent, currentPointerPosition: TypeMapMouseInfo): void => {
      const isDrawerDrawing = getStoreDrawerIsDrawing(mapId);
      const isDrawerEditing = getStoreDrawerIsEditing(mapId);

      if (isDrawerDrawing) {
        handleDrawingMode(event, currentPointerPosition);
      } else if (isDrawerEditing) {
        handleEditingMode(event, currentPointerPosition);
      } else {
        handleDefaultInteraction(event, currentPointerPosition);
      }
    },
    [mapId, handleDrawingMode, handleEditingMode, handleDefaultInteraction]
  );

  /**
   * Handles the main crosshair interaction (Enter/Space).
   */
  const handleCrosshairInteraction = useCallback(
    (event: HTMLElementEventMap[keyof HTMLElementEventMap]): void => {
      if (!isCrosshairsActive || !(event instanceof KeyboardEvent)) {
        return;
      }

      // Prevent interactions when typing in input fields
      const { activeElement } = document;
      if (
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        (activeElement as HTMLElement).isContentEditable
      ) {
        return;
      }

      const currentPointerPosition = getStoreMapPointerPosition(mapId);
      if (!currentPointerPosition) return;

      // Handle Shift+Click logic first
      if (handleShiftClick(event, currentPointerPosition)) {
        return; // Stop here if Shift+Click was handled
      }

      // If Shift+Click is not handled, proceed to other logic
      if (!drawerController) {
        handleDefaultInteraction(event, currentPointerPosition);
      } else {
        handleDrawerInteraction(event, currentPointerPosition);
      }
    },
    [isCrosshairsActive, mapId, handleShiftClick, handleDefaultInteraction, handleDrawerInteraction, drawerController]
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
  useEventListener<HTMLElement>('keydown', handlePanDelta, mapTargetElement, isCrosshairsActive);
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
