import { useEffect, useRef, useState } from 'react';
import { logger } from '../utils/logger';

// #region GET MAP STYLES
interface MapStyleProps {
  isMapFullScreen: boolean;
  isFooterBarCollapsed: boolean;
  footerPanelResizeValue: number;
  origHeight: string;
  windowHeight?: number;
}

type TypeMapStyles = {
  visibility: string;
  minHeight: string;
  height: string;
  zIndex?: string;
};

export const getMapStyles = ({
  isMapFullScreen,
  isFooterBarCollapsed,
  footerPanelResizeValue,
  origHeight,
  windowHeight = window.screen.height,
}: MapStyleProps): TypeMapStyles | null => {
  if (!isMapFullScreen) {
    return {
      visibility: 'visible',
      minHeight: origHeight,
      height: origHeight,
      zIndex: '0',
    };
  }

  if (isFooterBarCollapsed) {
    return null;
  }

  const isHidden = footerPanelResizeValue === 100; // assuming 100 is max value
  return {
    visibility: isHidden ? 'hidden' : 'visible',
    minHeight: isHidden ? '0px' : `${windowHeight - (windowHeight * footerPanelResizeValue) / 100}px`,
    height: isHidden ? '0px' : `${windowHeight - (windowHeight * footerPanelResizeValue) / 100}px`,
  };
};
// #end region GET MAP STYLES

// #region USE MAP RESIZE
interface UseMapResizeProps {
  isMapFullScreen: boolean;
  isFooterBarCollapsed: boolean;
  footerPanelResizeValue: number;
  mapLoaded: boolean;
  isFooterbar: boolean;
  geoviewElement: HTMLElement;
  footerTabContainer: HTMLElement | null;
}

type TypeUseMapResize = {
  mapContainerRef: React.RefObject<HTMLDivElement>;
  mapShellContainerRef: React.RefObject<HTMLDivElement>;
};

export const useMapResize = ({
  isMapFullScreen,
  isFooterBarCollapsed,
  footerPanelResizeValue,
  mapLoaded,
  isFooterbar,
  geoviewElement,
  footerTabContainer,
}: UseMapResizeProps): TypeUseMapResize => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapShellContainerRef = useRef<HTMLDivElement>(null);
  const [origHeight, setOrigHeight] = useState<string>('');

  // Set initial height
  useEffect(() => {
    if (mapContainerRef.current && mapShellContainerRef.current) {
      const height = geoviewElement?.dataset?.height ?? `${geoviewElement?.clientHeight}px`;
      setOrigHeight(height);
    }
  }, [geoviewElement]);

  // Handle footer bar collapse on map full screen
  useEffect(() => {
    logger?.logTraceUseEffect('SHELL - isFooterBarCollapsed.isMapFullScreen', isFooterBarCollapsed, isMapFullScreen);

    if (isMapFullScreen && mapContainerRef.current && mapShellContainerRef.current) {
      const tabHeight = footerTabContainer?.clientHeight ?? 0;
      const fullScreenStyles: TypeMapStyles = {
        visibility: 'visible',
        minHeight: `${window.screen.height - tabHeight}px`,
        height: `${window.screen.height - tabHeight}px`,
      };

      // Apply styles to map container
      Object.assign(mapContainerRef.current.style, fullScreenStyles);

      // Apply styles to shell container with additional z-index
      Object.assign(mapShellContainerRef.current.style, {
        ...fullScreenStyles,
        zIndex: '-1',
      });
    }
  }, [isFooterBarCollapsed, isMapFullScreen, footerTabContainer]);

  // Handle resize and fullscreen changes
  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current || !mapShellContainerRef.current) {
      return;
    }

    const styles = getMapStyles({
      isMapFullScreen,
      isFooterBarCollapsed,
      footerPanelResizeValue,
      origHeight,
    });

    if (styles) {
      Object.assign(mapContainerRef.current.style, styles);
      Object.assign(mapShellContainerRef.current.style, styles);

      if (isFooterbar && !isMapFullScreen) {
        Object.assign(geoviewElement.style, {
          height: 'fit-content',
          transition: 'height 0.2s ease-out 0.2s',
        });
      }
    }
  }, [footerPanelResizeValue, isMapFullScreen, origHeight, mapLoaded, isFooterBarCollapsed, geoviewElement, isFooterbar]);

  return { mapContainerRef, mapShellContainerRef };
};
// #end region USE MAP SIZE
