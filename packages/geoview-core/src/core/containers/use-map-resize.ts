import { useEffect, useRef } from 'react';
import { logger } from '@/core/utils/logger';

// #region USE MAP RESIZE

/** Props for the useMapResize hook. */
interface UseMapResizeProps {
  /** Whether the map is displayed in fullscreen mode. */
  isMapFullScreen: boolean;
  /** Whether the footer bar panel is open. */
  isFooterBarOpen: boolean;
  /** The footer panel resize percentage. */
  footerPanelResizeValue: number;
  /** Whether the map has a footer bar. */
  isFooterBar: boolean;
  /** The measured height of the collapsed footer chrome. */
  collapsedFooterHeight: number;
  /** The root GeoView element whose height accommodates the footer bar. */
  geoviewElement: HTMLElement;
  /** The configured application height in pixels. */
  appHeight: number;
}

/** Return type for the useMapResize hook. */
type TypeUseMapResize = {
  /** The ref for the map shell container. */
  mapShellContainerRef: React.RefObject<HTMLDivElement | null>;
  /** The host inline height captured before it was overridden with 'fit-content', if overridden. */
  hostOriginalHeightRef: React.RefObject<string | undefined>;
};

/**
 * Hook that manages map shell container resizing based on fullscreen and footer panel state.
 *
 * @param props - The resize hook configuration properties
 * @returns An object containing the mapShellContainerRef and hostOriginalHeightRef
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
  const hostOriginalHeightRef = useRef<string | undefined>(undefined);

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
      // Keep the authored height so host resize sync can still resolve it (e.g. 100%) after the override
      if (geoviewElement.style.height !== 'fit-content') hostOriginalHeightRef.current = geoviewElement.style.height;

      Object.assign(geoviewElement.style, {
        height: 'fit-content',
        transition: 'height 0.2s ease-out 0.2s',
      });
    }
  }, [geoviewElement, isFooterBar]);

  return { mapShellContainerRef, hostOriginalHeightRef };
};

// #endregion USE MAP RESIZE
