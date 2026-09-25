import type { SxProps } from 'geoview-core/ui/style/types';
import Draggable from 'react-draggable';
import { useMemo } from 'react';

import type RenderEvent from 'ol/render/Event';
import { getRenderPixel } from 'ol/render';
import type Layer from 'ol/layer/Layer';
import DragPan from 'ol/interaction/DragPan';

import type { SwipeOrientation, SwipeSide } from 'geoview-core/core/stores/states/swiper-state';
import {
  useStoreSwiperLayerPaths,
  useStoreSwiperLayerSides,
  useStoreSwiperOrientation,
} from 'geoview-core/core/stores/states/swiper-state';
import { logger } from 'geoview-core/core/utils/logger';
import { delay } from 'geoview-core/core/utils/utilities';
import { debounce } from 'geoview-core/core/utils/debounce';
import { getGVShellElement } from 'geoview-core/core/utils/dom-helper';
import { useTranslation } from 'geoview-core/core/translation/i18n';
import { useStoreMapSize } from 'geoview-core/core/stores/states/map-state';
import { useStoreLayerVisibleLayers } from 'geoview-core/core/stores/states/layer-state';
import type { MapViewer } from 'geoview-core/geo/map/map-viewer';
import type { ControllerRegistry } from 'geoview-core/core/controllers/base/controller-registry';
import type { AbstractBaseGVLayer } from 'geoview-core/geo/layer/gv-layers/abstract-base-layer';
import type { SwiperLayerEntry } from './swiper-types';
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
  /** The layer entries selected for swiping, each with its visible side. */
  layers: SwiperLayerEntry[];

  /** The orientation of the swiper divider. */
  orientation: SwipeOrientation;

  /** Whether the user can add/remove layers and set their side from the layer settings panel. */
  interactive: boolean;
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
  const isDraggingRef = useRef(false);

  // SxClasses
  const storeMapSize = useStoreMapSize();
  const mapHeight = storeMapSize[1];
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
  // Bumped on map resize (while not dragging) to remount the Draggable and reapply its defaultPosition
  const [resizeToken, setResizeToken] = useState(0);

  // Get store values
  const layerPaths = useStoreSwiperLayerPaths();
  const layerSides = useStoreSwiperLayerSides();
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
   * Toggles map interactivity so nothing on the OpenLayers map fights the swiper bar drag.
   *
   * Disables the drag-pan interaction and sets `pointer-events: none` on the map viewport for the
   * duration of the drag, so pointer events over the map can't start a pan or preventDefault the
   * pointer stream react-draggable relies on.
   *
   * @param active - Whether the map should be interactive
   */
  const setMapInteractive = useCallback(
    (active: boolean): void => {
      // Toggle the drag-pan interaction
      viewer.map.getInteractions().forEach((interaction) => {
        if (interaction instanceof DragPan) interaction.setActive(active);
      });

      // Toggle pointer events on the map viewport (react-draggable keeps working via document listeners)
      const viewport = viewer.map.getViewport();
      if (viewport) viewport.style.pointerEvents = active ? '' : 'none';
    },
    [viewer.map]
  );

  /**
   * Handles the start of a drag by flagging the drag and disabling map interaction under the bar.
   */
  const onStart = useCallback((): void => {
    isDraggingRef.current = true;
    // Make the map non-interactive for the whole drag: once the cursor moves off the thin bar onto the
    // map, OL would otherwise start a drag-pan and preventDefault the pointer stream, dropping the drag.
    setMapInteractive(false);
  }, [setMapInteractive]);

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
    isDraggingRef.current = false;

    // Re-enable map interaction now that the swiper drag is over
    setMapInteractive(true);

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
  }, [layerPaths.length, viewer.map, orientation, controllerRegistry.swiperController, setMapInteractive]);

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
   * Restores map interactivity if the swiper unmounts while a drag is in progress.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('SWIPER - drag interaction safety');

    return () => {
      setMapInteractive(true);
    };
  }, [setMapInteractive]);

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

    // Drop any attached layer that is no longer part of the swiper selection (without wiping the rest,
    // so already-clipped layers keep their handlers while others are still loading)
    setGvLayers((previous) => previous.filter((layer) => associatedLayerPaths.includes(layer.getLayerPath())));

    // Attach each layer to the swiper as soon as it registers instead of waiting for all of them,
    // so a freshly loaded layer is clipped immediately rather than only once the slowest one resolves.
    associatedLayerPaths.forEach((layerPath) => {
      controllerRegistry.layerController
        .waitForLayerRegistered(layerPath, TIMEOUT_WAIT_TO_ATTACH_LAYERS)
        .then((layer) => {
          if (cancelled || !layer) return;
          setGvLayers((previous) => (previous.includes(layer) ? previous : [...previous, layer]));
        })
        .catch((error: unknown) => {
          logger.logError('SWIPER - Failed to attach layer', layerPath, error);
        });
    });

    return () => {
      // Log
      logger.logTraceUseEffectUnmount('SWIPER - layerPaths', layerPaths);
      cancelled = true;
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

      // Resolve the visible side for this layer from its configured swiper path, normalized to the
      // current orientation (left/right for vertical, up/down for horizontal). Defaults to left/up.
      const gvLayerPath = layer.getLayerPath();
      const matchedPath = layerPaths.find((configuredPath) => gvLayerPath.includes(configuredPath));
      const configuredSide: SwipeSide | undefined = matchedPath ? layerSides[matchedPath] : undefined;
      let layerSide: SwipeSide;
      if (orientation === 'vertical') {
        layerSide = configuredSide === 'right' ? 'right' : 'left';
      } else {
        layerSide = configuredSide === 'down' ? 'down' : 'up';
      }

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

        // Divider position in map viewport CSS pixels along the relevant axis.
        const dividerX = (currentMapSize[0] * swiperValueVertical.current) / 100;
        const dividerY = (currentMapSize[1] * swiperValueHorizontal.current) / 100;

        // Compute the clip rectangle for this layer's visible side. The side names the portion that
        // stays visible: left/up reveal the layer before the bar, right/down reveal it after.
        let x0 = 0;
        let y0 = 0;
        let x1 = currentMapSize[0];
        let y1 = currentMapSize[1];
        if (orientation === 'vertical') {
          if (layerSide === 'right') x0 = dividerX;
          else x1 = dividerX;
        } else if (layerSide === 'down') {
          y0 = dividerY;
        } else {
          y1 = dividerY;
        }

        // A WebGL context exposes scissor(). Save its existing state because another renderer or
        // consumer may already be using a scissor box on the same context.
        if ('scissor' in context) {
          // WebGL's origin is at the bottom-left. getRenderPixel handles the CSS-to-render-pixel
          // conversion, including device pixel ratio and the renderer's coordinate transform.
          const bottomLeft = getRenderPixel(event, [x0, y1]);
          const topRight = getRenderPixel(event, [x1, y0]);
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
        const topLeft = getRenderPixel(event, [x0, y0]);
        const topRight = getRenderPixel(event, [x1, y0]);
        const bottomRight = getRenderPixel(event, [x1, y1]);
        const bottomLeft = getRenderPixel(event, [x0, y1]);

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
  }, [gvLayers, orientation, viewer.map, layerPaths, layerSides]);

  /**
   * Keeps the swiper bar and clipping aligned with the map when the map is resized.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('SWIPER - map resize', storeMapSize);

    // Keep the cached map size in sync so keyboard bounds and drag math use the current size
    mapSize.current = storeMapSize;

    // Never reposition/remount during an active drag (would drop the drag session)
    if (isDraggingRef.current) return;

    // Reposition the bar from the stored percentage so it stays proportionally in place
    setXPositionVertical((storeMapSize[0] * swiperValueVertical.current) / 100);
    setYPositionHorizontal((storeMapSize[1] * swiperValueHorizontal.current) / 100);

    // Remount the Draggable so it reapplies the updated defaultPosition, then repaint the clip
    setResizeToken((token) => token + 1);
    viewer.map.render();
  }, [storeMapSize, viewer.map]);

  /**
   * UseEffect for WCAG keyboard navigation.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('SWIPER - mount', viewer.mapId);

    const handleFocusIn = (): void => {
      // Set listener for the focus in on swiper bar when on WCAG mode
      if (getGVShellElement(viewer.mapId)!.classList.contains('map-focus-trap')) {
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
          key={`${orientation}-${resizeToken}`} // Recreate on orientation change or a resize-at-rest (never mid-drag)
          axis={orientation === 'vertical' ? 'x' : 'y'}
          bounds="parent"
          defaultPosition={
            orientation === 'vertical' ? { x: xPositionVertical, y: yPositionVertical } : { x: xPositionHorizontal, y: yPositionHorizontal }
          }
          onStart={onStart}
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
