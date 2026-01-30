import { useEffect, useRef } from 'react';
import { logger } from '@/core/utils/logger';

// #region USE MAP RESIZE
interface UseMapResizeProps {
  isMapFullScreen: boolean;
  isFooterBarOpen: boolean;
  footerPanelResizeValue: number;
  isFooterBar: boolean;
  geoviewElement: HTMLElement;
  footerTabContainer: HTMLElement | null;
  appHeight: number;
}

type TypeUseMapResize = {
  mapShellContainerRef: React.RefObject<HTMLDivElement>;
};

export const useMapResize = ({
  isMapFullScreen,
  isFooterBarOpen,
  footerPanelResizeValue,
  isFooterBar,
  geoviewElement,
  footerTabContainer,
  appHeight,
}: UseMapResizeProps): TypeUseMapResize => {
  const mapShellContainerRef = useRef<HTMLDivElement>(null);

  /**
   * Update map height when toggling fullscreen and changing footer panel size
   */
  useEffect(() => {
    logger.logTraceUseEffect('USE MAP RESIZE - adjust map height for fullscren');

    if (!mapShellContainerRef.current) {
      return;
    }

    // default values as set by the height of the div
    let containerHeight = `${appHeight}px`;
    let visibility = 'visible';

    // adjust values from px to % to accomodate fullscreen plus page zoom
    if (isMapFullScreen) {
      const tabHeight = footerTabContainer?.clientHeight ?? 0;

      // by default the footerbar is collapsed when a user goes fullscreen
      if (!isFooterBarOpen) {
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
  }, [footerTabContainer, footerPanelResizeValue, isFooterBarOpen, isMapFullScreen, appHeight]);

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
// #end region USE MAP SIZE
