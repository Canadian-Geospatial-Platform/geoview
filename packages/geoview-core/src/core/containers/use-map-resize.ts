import { useEffect, useRef, useState } from 'react';
import { logger } from '@/core/utils/logger';

// #region USE MAP RESIZE
interface UseMapResizeProps {
  isMapFullScreen: boolean;
  isFooterBarCollapsed: boolean;
  footerPanelResizeValue: number;
  mapLoaded: boolean;
  isFooterBar: boolean;
  geoviewElement: HTMLElement;
  footerTabContainer: HTMLElement | null;
}

type TypeUseMapResize = {
  mapShellContainerRef: React.RefObject<HTMLDivElement>;
};

export const useMapResize = ({
  isMapFullScreen,
  isFooterBarCollapsed,
  footerPanelResizeValue,
  mapLoaded,
  isFooterBar,
  geoviewElement,
  footerTabContainer,
}: UseMapResizeProps): TypeUseMapResize => {
  const mapShellContainerRef = useRef<HTMLDivElement>(null);
  const [origHeight, setOrigHeight] = useState<string>('');

  // Set initial height
  useEffect(() => {
    logger?.logTraceUseEffect('USE MAP RESIZE - set initial height');

    const height = geoviewElement?.dataset?.height ?? `${geoviewElement?.clientHeight}px`;
    setOrigHeight(height);
  }, [geoviewElement]);

  /**
   * Update map height when toggling fullscreen and changing footer panel size
   */
  useEffect(() => {
    if (!mapShellContainerRef.current) {
      return;
    }

    // default values as set by the height of the div
    let containerHeight = origHeight;
    let visibility = 'visible';

    // adjust values from px to % to accomodate fullscreen plus page zoom
    if (isMapFullScreen) {
      const tabHeight = footerTabContainer?.clientHeight ?? 0;

      // by default the footerbar is collapsed when a user goes fullscreen
      if (isFooterBarCollapsed) {
        containerHeight = `calc(100% - ${tabHeight}px)`;
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
  }, [footerTabContainer, footerPanelResizeValue, isFooterBarCollapsed, isMapFullScreen, origHeight]);

  useEffect(() => {
    // Update mapDiv height to accomodate the footerbar
    if (mapLoaded && isFooterBar) {
      Object.assign(geoviewElement.style, {
        height: 'fit-content',
        transition: 'height 0.2s ease-out 0.2s',
      });
    }
  }, [geoviewElement, isFooterBar, mapLoaded]);

  return { mapShellContainerRef };
};
// #end region USE MAP SIZE
