import type { SxProps } from 'geoview-core/ui/style/types';
import Draggable from 'react-draggable';
import { useMemo } from 'react';

import type RenderEvent from 'ol/render/Event';
import { getRenderPixel } from 'ol/render';
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
import type { AbstractBaseGVLayer } from 'geoview-core/geo/layer/gv-layers/abstract-base-layer';
import { getSxClasses } from './swiper-style';

/** The number of milliseconds to wait for a layer when trying to attach it to the swiper */
const TIMEOUT_WAIT_TO_ATTACH_LAYERS = 20000;

/** Saved WebGL scissor state restored after a swiped layer renders. */
type WebGLScissorState = {
  /** Whether the scissor test was enabled before rendering. */
  enabled: boolean;
  /** The scissor box active before rendering. */
  box: Int32Array;
};

/** Registered render handlers for a swiped layer. */
type LayerRenderHandlers = {
  /** Handles clipping before the layer renders. */
  preRender: (event: RenderEvent) => void;
  /** Restores the rendering context after the layer renders. */
  postRender: (event: RenderEvent) => void;
};

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

  /** The Swiper plugin configuration. */
  // We have this eslint here for "standardization between plugins"
  // eslint-disable-next-line react/no-unused-prop-types
  config: ConfigProps;
};

/** Configuration properties for the Swiper plugin. */
export type ConfigProps = {
  /** The layer paths selected for swiping. */
  layers: string[];

  /** The orientation of the swiper divider. */
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
  const [gvLayers, setGvLayers] = useState<AbstractBaseGVLayer[]>([]);
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
   * Handles drag events and requests a render at the updated swiper position.
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

    // Render the map so the target layers use the updated clip position
    viewer.map.render();
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

    // Render the map so the target layers use the updated clip position
    viewer.map.render();
  }, [layerPaths.length, viewer.map, orientation, controllerRegistry.swiperController]);

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

  // #endregion

  /**
   * Tracks the OL layers resolved from the configured swiper layer paths.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('SWIPER - layerPaths', layerPaths);

    // Flag to prevent state updates after cleanup
    let cancelled = false;

    // Get all associated layerPaths in case provided path is a layer ID or group layer path
    const associatedLayerPaths = layerPaths
      .map((layerPath) => visibleLayers.filter((visibleLayerPath) => visibleLayerPath.includes(layerPath)))
      .flat();

    // Fetch all OL layers in parallel and set state once
    Promise.all(
      associatedLayerPaths.map((layerPath) => {
        return controllerRegistry.layerController
          .waitForLayerRegistered(layerPath, TIMEOUT_WAIT_TO_ATTACH_LAYERS)
          .catch((error: unknown) => {
            logger.logError('SWIPER - Failed to attach layer', layerPath, error);
            return undefined;
          });
      })
    )
      .then((layers) => {
        if (cancelled) return;
        const validLayers = layers.filter((layer): layer is AbstractBaseGVLayer => !!layer);
        setGvLayers(validLayers);
      })
      .catch((error: unknown) => {
        logger.logPromiseFailed('SWIPER - waitForLayerRegistered in useEffect', error);
      });

    return () => {
      // Log
      logger.logTraceUseEffectUnmount('SWIPER - layerPaths', layerPaths);
      cancelled = true;

      // Empty layers array
      setGvLayers([]);
    };
  }, [controllerRegistry, layerPaths, visibleLayers]);

  /**
   * Registers per-layer render handlers so clipping affects only the configured layers.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('SWIPER - layer render clipping', gvLayers, orientation);

    if (!gvLayers.length) return undefined;

    // Keep each handler pair so the exact same function references can be removed during cleanup.
    const handlersByLayer = new Map<AbstractBaseGVLayer, LayerRenderHandlers>();

    gvLayers.forEach((layer) => {
      // AbstractBaseGVLayer exposes BaseLayer, but resolved leaf layers use the renderable Layer
      // event surface that provides the prerender and postrender events.
      const olLayer = layer.getOLLayer() as Layer;

      // OpenLayers vector renderers use a temporary canvas when layer opacity is below 1. Read the
      // renderer's current context because the RenderEvent context remains the destination canvas.
      let canvasContextSaved: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | undefined;
      let webGLContext: WebGLRenderingContext | WebGL2RenderingContext | undefined;
      let webGLScissorState: WebGLScissorState | undefined;

      // Clip immediately before this specific layer renders. Applying the clip at the layer event
      // level is important because OpenLayers can compose multiple layers into one shared canvas.
      const preRender = (event: RenderEvent): void => {
        const rendererContext = (olLayer.getRenderer() as { context?: typeof event.context }).context;
        const context = rendererContext ?? event.context;
        const currentMapSize = viewer.map.getSize();
        if (!context || !currentMapSize) return;

        // Convert the current divider percentage into a rectangle in map viewport CSS pixels.
        // Vertical swiping exposes the left side; horizontal swiping exposes the top side.
        const swiperValue = orientation === 'vertical' ? swiperValueVertical.current : swiperValueHorizontal.current;
        const clipWidth = orientation === 'vertical' ? (currentMapSize[0] * swiperValue) / 100 : currentMapSize[0];
        const clipHeight = orientation === 'horizontal' ? (currentMapSize[1] * swiperValue) / 100 : currentMapSize[1];

        // A WebGL context exposes scissor(). Save its existing state because another renderer or
        // consumer may already be using a scissor box on the same context.
        if ('scissor' in context) {
          // WebGL's origin is at the bottom-left. getRenderPixel handles the CSS-to-render-pixel
          // conversion, including device pixel ratio and the renderer's coordinate transform.
          const bottomLeft = getRenderPixel(event, [0, clipHeight]);
          const topRight = getRenderPixel(event, [clipWidth, 0]);
          webGLContext = context;
          webGLScissorState = {
            enabled: context.isEnabled(context.SCISSOR_TEST),
            box: new Int32Array(context.getParameter(context.SCISSOR_BOX) as Int32Array),
          };

          // Limit this layer's WebGL draw calls to the visible side of the swiper.
          context.enable(context.SCISSOR_TEST);
          context.scissor(
            Math.min(bottomLeft[0], topRight[0]),
            Math.min(bottomLeft[1], topRight[1]),
            Math.abs(topRight[0] - bottomLeft[0]),
            Math.abs(topRight[1] - bottomLeft[1])
          );
          return;
        }

        // Canvas clipping uses all four viewport corners. getRenderPixel makes the polygon safe
        // for rotated maps and high-DPI displays instead of assuming CSS and canvas pixels match.
        const topLeft = getRenderPixel(event, [0, 0]);
        const topRight = getRenderPixel(event, [clipWidth, 0]);
        const bottomRight = getRenderPixel(event, [clipWidth, clipHeight]);
        const bottomLeft = getRenderPixel(event, [0, clipHeight]);

        // Save before clipping because Canvas clip regions are cumulative and cannot be directly
        // reset. postrender restores this state after only the target layer has been drawn.
        canvasContextSaved = context;
        context.save();
        context.beginPath();
        context.moveTo(topLeft[0], topLeft[1]);
        context.lineTo(bottomLeft[0], bottomLeft[1]);
        context.lineTo(bottomRight[0], bottomRight[1]);
        context.lineTo(topRight[0], topRight[1]);
        context.closePath();
        context.clip();
      };

      // Restore whichever rendering context was changed in prerender. Leaving either clipping
      // mechanism active would affect layers rendered afterward on the same underlying context.
      const postRender = (): void => {
        if (webGLContext && webGLScissorState) {
          // Restore both the previous box and whether scissor testing was originally enabled.
          webGLContext.scissor(webGLScissorState.box[0], webGLScissorState.box[1], webGLScissorState.box[2], webGLScissorState.box[3]);
          if (!webGLScissorState.enabled) webGLContext.disable(webGLContext.SCISSOR_TEST);
          webGLContext = undefined;
          webGLScissorState = undefined;
          return;
        }

        if (canvasContextSaved) {
          canvasContextSaved.restore();
          canvasContextSaved = undefined;
        }
      };

      olLayer.on('prerender', preRender);
      olLayer.on('postrender', postRender);
      handlersByLayer.set(layer, { preRender, postRender });
    });

    // Request a frame immediately so newly selected layers are clipped without waiting for a map interaction.
    viewer.map.render();

    return () => {
      // Log
      logger.logTraceUseEffectUnmount('SWIPER - layer render clipping', gvLayers, orientation);

      // Remove handlers before requesting the next frame so deselected layers render in full.
      handlersByLayer.forEach(({ preRender, postRender }, layer) => {
        const olLayer = layer.getOLLayer() as Layer;
        olLayer.un('prerender', preRender);
        olLayer.un('postrender', postRender);
      });

      // Repaint after cleanup to remove the previous frame's clipped target output immediately.
      viewer.map.render();
    };
  }, [gvLayers, orientation, viewer.map]);

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
            sx={[orientation === 'vertical' ? memoSxClasses.vertical : memoSxClasses.horizontal, memoSxClasses.bar] as SxProps}
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
