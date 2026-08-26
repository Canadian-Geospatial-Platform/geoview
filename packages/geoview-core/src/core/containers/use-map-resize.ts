import { useEffect, useRef } from 'react';
import { logger } from '@/core/utils/logger';

// #region USE MAP RESIZE

/** Props for the useMapResize hook. */
interface UseMapResizeProps {
  isMapFullScreen: boolean;
  isFooterBarOpen: boolean;
  footerPanelResizeValue: number;
  isFooterBar: boolean;
  collapsedFooterHeight: number;
  geoviewElement: HTMLElement;
  appHeight: number;
}

/** Return type for the useMapResize hook. */
type TypeUseMapResize = {
  mapShellContainerRef: React.RefObject<HTMLDivElement | null>;
};

/**
 * Hook that manages map shell container resizing based on fullscreen and footer panel state.
 *
 * @param props - The resize hook configuration properties
 * @returns An object containing the mapShellContainerRef
 */
export const useMapResize = ({
  isMapFullScreen,
  isFooterBarOpen,
  footerPanelResizeValue,
  isFooterBar,
  collapsedFooterHeight,
  geoviewElement,
  appHeight,
}: UseMapResizeProps): TypeUseMapResize => {
  const mapShellContainerRef = useRef<HTMLDivElement>(null);

  /**
   * Updates map height when toggling fullscreen and changing footer panel size.
   */
  useEffect(() => {
    logger.logTraceUseEffect('USE MAP RESIZE - adjust map height for fullscreen');

    if (!mapShellContainerRef.current) {
      return;
    }

    const availableMapHeight = Math.max(appHeight - (isFooterBar ? collapsedFooterHeight : 0), 0);

    // default values as set by the height of the div
    let containerHeight = `${availableMapHeight}px`;
    let containerFlex = '';
    let visibility = 'visible';

    // adjust values from px to % to accomodate fullscreen plus page zoom
    if (isMapFullScreen) {
      // by default the footerbar is collapsed when a user goes fullscreen
      if (!isFooterBarOpen) {
        // Use flex growth to fill remaining space in the shell's flex column,
        // regardless of sibling elements (skip links, CircularProgress, etc.)
        containerHeight = 'auto';
        containerFlex = '1';
      } else {
        containerHeight = `${100 - footerPanelResizeValue}%`;

        // footerPanelResizeValue is 100
        if (footerPanelResizeValue === 100) {
          visibility = 'hidden';
          containerHeight = '0';
        }
      }
    }

    mapShellContainerRef.current.style.visibility = visibility;
    mapShellContainerRef.current.style.height = containerHeight;
    mapShellContainerRef.current.style.flex = containerFlex;
  }, [footerPanelResizeValue, isFooterBar, isFooterBarOpen, isMapFullScreen, appHeight, collapsedFooterHeight]);

  /**
   * Adjusts geoviewElement height to accommodate the footer bar.
   */
  useEffect(() => {
    logger.logTraceUseEffect('USE MAP RESIZE - adjust geoviewElement height for Footerbar');

    // Update mapDiv height to accomodate the footerbar
    if (isFooterBar) {
      Object.assign(geoviewElement.style, {
        height: 'fit-content',
        transition: 'height 0.2s ease-out 0.2s',
      });
    }
  }, [geoviewElement, isFooterBar]);

  return { mapShellContainerRef };
};

// #endregion USE MAP RESIZE
