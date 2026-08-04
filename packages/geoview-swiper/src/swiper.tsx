import Draggable from 'react-draggable';
import { useMemo } from 'react';

import type BaseLayer from 'ol/layer/Base';
import type Layer from 'ol/layer/Layer';

import type { SwipeOrientation } from 'geoview-core/core/stores/states/swiper-state';
import { useStoreSwiperLayerPaths, useStoreSwiperOrientation } from 'geoview-core/core/stores/states/swiper-state';
import { logger } from 'geoview-core/core/utils/logger';
import { delay } from 'geoview-core/core/utils/utilities';
import { useTranslation } from 'geoview-core/core/translation/i18n';
import { debounce } from 'geoview-core/core/utils/debounce';
import { useStoreMapSize } from 'geoview-core/core/stores/states/map-state';
import { useStoreLayerVisibleLayers } from 'geoview-core/core/stores/states/layer-state';
import type { MapViewer } from 'geoview-core/geo/map/map-viewer';
import type { ControllerRegistry } from 'geoview-core/core/controllers/base/controller-registry';
import { getSxClasses } from './swiper-style';

/** Properties for the Swiper component. */
type SwiperProps = {
  /**
   * The MapViewer associated with the Swiper component.*
   *
   * @remarks The controller registry has to be provided via params, because the Swiper itself resides outside of the MapViewer context.
   */
  viewer: MapViewer;

  /**
   * The ControllerRegistry associated with the Swiper component.
   *
   * @remarks The controller registry has to be provided via params, because the Swiper itself resides outside of the MapViewer context.
   */
  controllerRegistry: ControllerRegistry;

  // We have this eslint here for "standardization between plugins"
  // eslint-disable-next-line react/no-unused-prop-types
  config: ConfigProps;
};

/** Configuration properties for the Swiper plugin. */
export type ConfigProps = {
  layers: string[];
  orientation: SwipeOrientation;
};

/**
 * Swiper component that provides a draggable bar to compare underlying layers.
 *
 * @param props - The Swiper component properties
 * @returns The Swiper JSX element
 */
export function Swiper(props: SwiperProps): JSX.Element {
  // Log
  logger.logTraceRender('geoview-swiper/swiper');

  const { viewer, controllerRegistry } = props;

  const { cgpv } = window;
  const { ui, reactUtilities } = cgpv;
  const { useEffect, useState, useRef, useCallback } = reactUtilities.react;
  const { Box, Tooltip, HandleIcon } = ui.elements;

  // Refs
  const mapSize = useRef<number[]>(viewer.map?.getSize() || [0, 0]);
  const swiperValueVertical = useRef(50);
  const swiperValueHorizontal = useRef(50);
  const swiperRef = useRef<HTMLElement>(null);

  // SxClasses
  const mapHeight = useStoreMapSize()[1];
  const memoSxClasses = useMemo(() => {
    logger.logTraceUseMemo('SWIPER - memoSxClasses', mapHeight);
    return getSxClasses(mapHeight);
  }, [mapHeight]);

  // States
  const [olLayers, setOlLayers] = useState<BaseLayer[]>([]);
  const [xPositionVertical, setXPositionVertical] = useState(mapSize.current[0] / 2);
  const [yPositionVertical, setYPositionVertical] = useState(0);
  const [xPositionHorizontal, setXPositionHorizontal] = useState(0);
  const [yPositionHorizontal, setYPositionHorizontal] = useState(mapSize.current[1] / 2);

  // Get store values
  const layerPaths = useStoreSwiperLayerPaths();
  const { t } = useTranslation<string>();
  const visibleLayers = useStoreLayerVisibleLayers();
  const orientation = useStoreSwiperOrientation();

  // Grab reference
  const theSwiper = swiperRef.current;

  // #region Handlers

  /**
   * Gets the renderer container element for an OL layer.
   * The container is a protected property on CanvasLayerRenderer, accessed via cast.
   *
   * @param layer - The OL layer
   * @returns The container HTMLElement, or undefined
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getRendererContainer = (layer: BaseLayer): HTMLElement | undefined => {
    const renderer = (layer as Layer).getRenderer?.();
    // Access the protected 'container' property which exists at runtime on CanvasLayerRenderer
    return (renderer as any)?.container as HTMLElement | undefined;
  };

  /**
   * Applies CSS clip-path on each tracked OL layer's renderer container to clip the layer
   * at the swiper position. This approach works regardless of layer opacity because it clips
   * the final rendered DOM element, not the canvas context.
   */
  const applyClipPath = useCallback((): void => {
    const swiperValue = orientation === 'vertical' ? swiperValueVertical.current : swiperValueHorizontal.current;

    olLayers.forEach((layer: BaseLayer) => {
      const container = getRendererContainer(layer);
      if (container) {
        if (orientation === 'vertical') {
          // Clip: show left portion up to swiperValue%
          container.style.clipPath = `inset(0 ${100 - swiperValue}% 0 0)`;
        } else {
          // Clip: show top portion up to swiperValue%
          container.style.clipPath = `inset(0 0 ${100 - swiperValue}% 0)`;
        }
      }
    });
  }, [olLayers, orientation]);

  /**
   * Removes CSS clip-path from all tracked OL layer renderer containers.
   */
  const removeClipPath = useCallback((): void => {
    olLayers.forEach((layer: BaseLayer) => {
      const container = getRendererContainer(layer);
      if (container) {
        container.style.clipPath = '';
      }
    });
  }, [olLayers]);

  /**
   * Calculates the computed style to return values of x and y position.
   *
   * @returns The array of value for x and y position for the swiper bar
   */
  const getSwiperStyle = (): number[] => {
    const style = window.getComputedStyle(swiperRef.current as HTMLElement);
    const matrix = new DOMMatrixReadOnly(style.transform);
    return [matrix.m41, matrix.m42];
  };

  /**
   * Handles drag events - update refs and apply clip-path.
   */
  const onDrag = debounce(() => {
    if (!layerPaths.length) return;

    // Get map size
    mapSize.current = viewer.map.getSize() || [0, 0];

    // Update refs ONLY
    if (orientation === 'vertical') {
      const [x] = getSwiperStyle();
      swiperValueVertical.current = (x / mapSize.current[0]) * 100;
    } else {
      const [, y] = getSwiperStyle();
      swiperValueHorizontal.current = (y / mapSize.current[1]) * 100;
    }

    // Apply CSS clip-path
    applyClipPath();
  }, 100);

  /**
   * Handles drag stop - sync everything to React state and store.
   */
  const onStop = useCallback((): void => {
    if (!layerPaths.length) return;

    // Get map size
    mapSize.current = viewer.map.getSize() || [0, 0];

    // Update refs, React state, and controller/store
    if (orientation === 'vertical') {
      const [x] = getSwiperStyle();
      swiperValueVertical.current = (x / mapSize.current[0]) * 100;
      setXPositionVertical(x);
      setYPositionVertical(0);
      controllerRegistry.swiperController?.setSwiperPosition(swiperValueVertical.current);
    } else {
      const [, y] = getSwiperStyle();
      swiperValueHorizontal.current = (y / mapSize.current[1]) * 100;
      setXPositionHorizontal(0);
      setYPositionHorizontal(y);
      controllerRegistry.swiperController?.setSwiperPosition(swiperValueHorizontal.current);
    }

    // Apply CSS clip-path
    applyClipPath();
  }, [layerPaths.length, viewer.map, orientation, olLayers, controllerRegistry.swiperController, applyClipPath]);

  /**
   * Updates swiper and layers from keyboard CTRL + Arrow key.
   *
   * @param event - The keyboard event to calculate the swiper position
   */
  const updateSwiper = useCallback(
    (event: KeyboardEvent): void => {
      // * there is a know issue when stiching from keyboard to mouse swiper but we can live with it as we are not expecting to face this
      // * offset from mouse method is not working properly anymore
      if ('ArrowLeft ArrowRight ArrowUp ArrowDown'.includes(event.key) && layerPaths.length) {
        // Prevent default behavior and stop propagation immediately
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        // Get swiper bar style then set the move
        const styleValues = getSwiperStyle();
        const move = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -10 : 10;

        // Check if value is outside the window and apply modification
        // eslint-disable-next-line no-nested-ternary
        styleValues[0] = styleValues[0] <= 10 ? 10 : styleValues[0] >= mapSize.current[0] - 10 ? mapSize.current[0] - 10 : styleValues[0];
        // eslint-disable-next-line no-nested-ternary
        styleValues[1] = styleValues[1] <= 10 ? 10 : styleValues[1] >= mapSize.current[1] - 10 ? mapSize.current[1] - 10 : styleValues[1];

        // Apply new style to the bar
        swiperRef.current!.style.transform =
          orientation === 'vertical' ? `translate(${styleValues[0] + move}px, 0px)` : `translate(0px, ${styleValues[1] + move}px)`;

        // Send the onStop event to update layers
        delay(100)
          .then(onStop)
          .catch((error: unknown) => {
            logger.logPromiseFailed('updateSwiper in Swiper', error);
          }); // Wait for the DOM to update
      }
    },
    [layerPaths, orientation, onStop]
  );

  /**
   * Tracks the OL layer at the given layer path and applies the CSS clip-path to it.
   *
   * @param layerPath - The layer path of the layer to track for swiping
   */
  const attachLayerOnPath = useCallback(
    async (layerPath: string) => {
      try {
        // Get the layer at the layer path
        const olLayer = await controllerRegistry.layerController.getOLLayerAsync(layerPath);

        // Set the OL layers
        setOlLayers((prevArray) => [...prevArray, olLayer]);
      } catch (error: unknown) {
        // Log
        logger.logError(
          'SWIPER - Failed to attach layer',
          controllerRegistry.layerController.getGeoviewLayerIds(),
          layerPath,
          error
        );
      }
    },
    [controllerRegistry]
  );

  // #endregion

  /**
   * UseEffect for tracking layers. This will track the OL layers at the layer paths for clip-path application.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('SWIPER - layerPaths', layerPaths);

    // Get all associated layerPaths in case provided path is a layer ID or group layer path
    const associatedLayerPaths = layerPaths
      .map((layerPath) => visibleLayers.filter((visibleLayerPath) => visibleLayerPath.includes(layerPath)))
      .flat();

    // For each layer path
    associatedLayerPaths.forEach((layerPath: string) => {
      // Track the layer
      attachLayerOnPath(layerPath).catch((error: unknown) => {
        // Log
        logger.logPromiseFailed('attachLayerOnPath in useEffect in Swiper', error);
      });
    });

    return () => {
      // Log
      logger.logTraceUseEffectUnmount('SWIPER - layerPaths', layerPaths);

      // Remove clip-path from layers and clear tracking
      associatedLayerPaths.forEach((layerPath: string) => {
        try {
          const olLayer = controllerRegistry.layerController.getGeoviewLayerIfExists(layerPath)?.getOLLayer();
          if (olLayer) {
            // Remove CSS clip-path
            const container = getRendererContainer(olLayer);
            if (container) {
              container.style.clipPath = '';
            }
          } else {
            // Log
            logger.logError('SWIPER - Failed to find layer to remove clip-path', layerPath);
          }
        } catch (error: unknown) {
          // Log
          logger.logError('SWIPER - Failed to remove clip-path from layer', layerPath, error);
        }
      });

      // Empty layers array
      setOlLayers([]);
    };
  }, [controllerRegistry, layerPaths, attachLayerOnPath, visibleLayers]);

  /**
   * UseEffect for applying and maintaining clip-path. Applies clip-path on initial layer tracking
   * and re-applies after each map render (OL may recreate renderer containers during renders).
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('SWIPER - applyClipPath', olLayers);

    if (!olLayers.length) return undefined;

    // Apply clip-path immediately for newly tracked layers
    applyClipPath();

    // Re-apply clip-path after each map render cycle (OL may replace containers)
    const handlePostRender = (): void => {
      applyClipPath();
    };
    viewer.map.on('postrender', handlePostRender);

    return () => {
      // Log
      logger.logTraceUseEffectUnmount('SWIPER - applyClipPath', olLayers);
      viewer.map.un('postrender', handlePostRender);
      removeClipPath();
    };
  }, [olLayers, applyClipPath, removeClipPath, viewer.map]);

  /**
   * UseEffect for WCAG keyboard navigation.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('SWIPER - mount', viewer.mapId);

    const handleFocusIn = (): void => {
      // Set listener for the focus in on swiper bar when on WCAG mode
      if (document.getElementById(`shell-${viewer.mapId}`)!.classList.contains('map-focus-trap')) {
        theSwiper?.addEventListener('keydown', updateSwiper);
      }
    };

    const handleFocusOut = (): void => {
      // Unset listener when focus is out of swiper bar
      theSwiper?.removeEventListener('keydown', updateSwiper);
    };

    // Wire events
    theSwiper?.addEventListener('focusin', handleFocusIn);
    theSwiper?.addEventListener('focusout', handleFocusOut);

    // Cleanup on unmount
    return () => {
      // Log
      logger.logTraceUseEffectUnmount('SWIPER - unmount', viewer.mapId);

      // Unwire events
      theSwiper?.removeEventListener('focusout', handleFocusOut);
      theSwiper?.removeEventListener('focusin', handleFocusIn);
    };
  }, [theSwiper, updateSwiper, viewer.mapId]);

  // If any layer paths
  if (layerPaths && layerPaths.length > 0) {
    // Use a swiper
    return (
      <Box sx={memoSxClasses.layerSwipe}>
        <Draggable
          nodeRef={swiperRef}
          key={orientation} // This forces recreation when orientation changes
          axis={orientation === 'vertical' ? 'x' : 'y'}
          bounds="parent"
          defaultPosition={
            orientation === 'vertical' ? { x: xPositionVertical, y: yPositionVertical } : { x: xPositionHorizontal, y: yPositionHorizontal }
          }
          onStop={onStop}
          onDrag={onDrag}
        >
          <Box
            sx={[orientation === 'vertical' ? memoSxClasses.vertical : memoSxClasses.horizontal, memoSxClasses.bar]}
            tabIndex={0}
            ref={swiperRef}
          >
            <Tooltip title={t('swiper.tooltip')}>
              <Box className="handleContainer">
                <HandleIcon sx={memoSxClasses.handle} className="handleL" />
                <HandleIcon sx={memoSxClasses.handle} className="handleR" />
              </Box>
            </Tooltip>
          </Box>
        </Draggable>
      </Box>
    );
  }
  return <Box />;
}
