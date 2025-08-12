import Draggable from 'react-draggable';

import { getRenderPixel } from 'ol/render';
import RenderEvent from 'ol/render/Event';
import BaseLayer from 'ol/layer/Base';
import { EventTypes } from 'ol/Observable';
import BaseEvent from 'ol/events/Event';

import debounce from 'lodash/debounce';

import { useSwiperLayerPaths, useSwiperOrientation } from 'geoview-core/core/stores/store-interface-and-intial-values/swiper-state';
import { logger } from 'geoview-core/core/utils/logger';
import { getLocalizedMessage, delay } from 'geoview-core/core/utils/utilities';
import { useAppDisplayLanguage } from 'geoview-core/core/stores/store-interface-and-intial-values/app-state';
import { useMapVisibleLayers } from 'geoview-core/core/stores/store-interface-and-intial-values/map-state';
import { MapViewer } from 'geoview-core/geo/map/map-viewer';
import { sxClasses } from './swiper-style';

type SwiperProps = {
  viewer: MapViewer;
  // We have this eslint here for "standardization between plugins"
  // eslint-disable-next-line react/no-unused-prop-types
  config: ConfigProps;
};

export type ConfigProps = {
  layers: string[];
  orientation: string;
};

const CONST_LAYERS_WAIT = 30000; // 30 seconds
const CONST_LAYERS_RETRY = 1000; // 1 second

export function Swiper(props: SwiperProps): JSX.Element {
  const { viewer } = props;

  const { cgpv } = window;
  const { ui, reactUtilities } = cgpv;
  const { useEffect, useState, useRef, useCallback } = reactUtilities.react;
  const { Box, Tooltip, HandleIcon } = ui.elements;

  const mapSize = useRef<number[]>(viewer.map?.getSize() || [0, 0]);
  const swiperValueVertical = useRef(50);
  const swiperValueHorizontal = useRef(50);
  const swiperRef = useRef<HTMLElement>();

  const [olLayers, setOlLayers] = useState<BaseLayer[]>([]);
  const [xPositionVertical, setXPositionVertical] = useState(mapSize.current[0] / 2);
  const [yPositionVertical, setYPositionVertical] = useState(0);
  const [xPositionHorizontal, setXPositionHorizontal] = useState(0);
  const [yPositionHorizontal, setYPositionHorizontal] = useState(mapSize.current[1] / 2);

  // Get store values
  const layerPaths = useSwiperLayerPaths();
  const displayLanguage = useAppDisplayLanguage();
  const visibleLayers = useMapVisibleLayers();
  const orientation = useSwiperOrientation();

  // Grab reference
  const theSwiper = swiperRef.current;

  /**
   * Pre compose, Pre render event callback
   * @param {Event | BaseEvent} event - The pre compose, pre render event
   */
  const prerender = useCallback(
    (event: Event | BaseEvent) => {
      // Log
      logger.logTraceUseCallback('SWIPER - prerender', event);

      const evt = event as RenderEvent;
      const ctx: CanvasRenderingContext2D = evt.context! as CanvasRenderingContext2D;
      const swiperValue = orientation === 'vertical' ? swiperValueVertical.current : swiperValueHorizontal.current;
      const width = ((mapSize.current[0] + 6) * swiperValue) / 100;
      const height = ((mapSize.current[1] + 6) * swiperValue) / 100;

      const tl = getRenderPixel(evt, [0, 0]);
      const tr = orientation === 'vertical' ? getRenderPixel(evt, [width, 0]) : getRenderPixel(evt, [mapSize.current[0], 0]);
      const bl = orientation === 'vertical' ? getRenderPixel(evt, [0, mapSize.current[1]]) : getRenderPixel(evt, [0, height]);
      const br =
        orientation === 'vertical' ? getRenderPixel(evt, [width, mapSize.current[1]]) : getRenderPixel(evt, [mapSize.current[0], height]);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(tl[0], tl[1]);
      ctx.lineTo(bl[0], bl[1]);
      ctx.lineTo(br[0], br[1]);
      ctx.lineTo(tr[0], tr[1]);
      ctx.closePath();
      ctx.clip();
    },
    [orientation]
  );

  /**
   * Post compose, Post render event callback
   * @param {Event | BaseEvent} event - The post compose, post render event
   */
  function postcompose(event: Event | BaseEvent): void {
    const evt = event as RenderEvent;
    const ctx: CanvasRenderingContext2D | WebGLRenderingContext = evt.context!;
    if (ctx instanceof WebGLRenderingContext) {
      if (evt.type === 'postrender') {
        ctx.disable(ctx.SCISSOR_TEST);
      }
    } else if (evt.target.getClassName && evt.target.getClassName() !== 'ol-layer' && evt.target.get('declutter')) {
      // Restore context when decluttering is done (ol>=6)
      // https://github.com/openlayers/openlayers/issues/10096
      setTimeout(() => {
        ctx.restore();
      }, 0);
    } else {
      ctx.restore();
    }
  }

  /**
   * Calculate the computed style to return values of x and y position
   * @returns {Number[]} The array of value for x and y position fot the swiper bar
   */
  const getSwiperStyle = (): number[] => {
    const style = window.getComputedStyle(swiperRef.current as HTMLElement);
    const matrix = new DOMMatrixReadOnly(style.transform);
    return [matrix.m41, matrix.m42];
  };

  /**
   * On Drag and Drag Stop, calculate the clipping extent
   */
  const onStop = debounce(() => {
    if (layerPaths.length) {
      // Get map size
      mapSize.current = viewer.map.getSize() || [0, 0];

      // Update the position and swiper %
      if (orientation === 'vertical') {
        const [x] = getSwiperStyle();
        swiperValueVertical.current = (x / mapSize.current[0]) * 100;
        setXPositionVertical(x);
        setYPositionVertical(0);
      } else {
        const [, y] = getSwiperStyle();
        swiperValueHorizontal.current = (y / mapSize.current[1]) * 100;
        setXPositionHorizontal(0);
        setYPositionHorizontal(y);
      }

      // Force refresh
      olLayers.forEach((layer: BaseLayer) => {
        layer.changed();
      });
    }
  }, 100);

  /**
   * Update swiper and layers from keyboard CTRL + Arrow key
   * @param {KeyboardEvent} event - The keyboard event to calculate the swiper position
   */
  const updateSwiper = useCallback(
    (event: KeyboardEvent): void => {
      // Log
      logger.logTraceUseCallback('SWIPER - updateSwiper', event.key);

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
   * Attaches necessary swiper events to the given layer path layer
   * @param {string} layerPath - The layer path of the layer to attach swiping events to
   */
  const attachLayerEventsOnPath = useCallback(
    async (layerPath: string) => {
      try {
        // Get the layer at the layer path
        const olLayer = await viewer.layer.getOLLayerAsync(layerPath, CONST_LAYERS_WAIT, CONST_LAYERS_RETRY);

        // Set the OL layers
        setOlLayers((prevArray) => [...prevArray, olLayer]);

        // Wire events on the layer
        olLayer.on(['precompose' as EventTypes, 'prerender' as EventTypes], prerender);
        olLayer.on(['postcompose' as EventTypes, 'postrender' as EventTypes], postcompose);

        // Force refresh
        olLayer.changed();
      } catch (error: unknown) {
        // Log
        logger.logError('SWIPER - Failed to attach layer events', viewer.layer?.getGeoviewLayerIds(), layerPath, error);
      }
    },
    [viewer, prerender]
  );

  // UseEffect for attaching layer events
  // This will attach the events to the layers at the layer paths
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('SWIPER - layerPaths', layerPaths);

    // Get all associated layerPaths in case provided path is a layer ID or group layer path
    const associatedLayerPaths = layerPaths
      .map((layerPath) => visibleLayers.filter((visibleLayerPath) => visibleLayerPath.includes(layerPath)))
      .flat();

    // For each layer path
    associatedLayerPaths.forEach((layerPath: string) => {
      // Wire events on the layer path
      attachLayerEventsOnPath(layerPath).catch((error: unknown) => {
        // Log
        logger.logPromiseFailed('attachLayerEventsOnPath in useEffect in Swiper', error);
      });
    });

    return () => {
      // Log
      logger.logTraceUseEffectUnmount('SWIPER - layerPaths', layerPaths);

      // set listener for layers in config array
      associatedLayerPaths.forEach((layerPath: string) => {
        try {
          // Get the layer at the layer path
          const olLayer = viewer.layer.getOLLayer(layerPath);
          if (olLayer) {
            // Unwire the events on the layer
            olLayer.un(['precompose' as EventTypes, 'prerender' as EventTypes], prerender);
            olLayer.un(['postcompose' as EventTypes, 'postrender' as EventTypes], postcompose);

            // Force refresh
            olLayer.changed();
          } else {
            // Log
            logger.logError('SWIPER - Failed to find layer to un-attach layer events', layerPath);
          }
        } catch (error: unknown) {
          // Log
          logger.logError('SWIPER - Failed to un-attach layer events', layerPath, error);
        }
      });

      // Empty layers array
      setOlLayers([]);
    };
  }, [viewer, layerPaths, attachLayerEventsOnPath, prerender, visibleLayers]);

  // UseEffect for WCAG keyboard navigation
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
      <Box sx={sxClasses.layerSwipe}>
        <Draggable
          key={orientation} // This forces recreation when orientation changes
          axis={orientation === 'vertical' ? 'x' : 'y'}
          bounds="parent"
          defaultPosition={
            orientation === 'vertical' ? { x: xPositionVertical, y: yPositionVertical } : { x: xPositionHorizontal, y: yPositionHorizontal }
          }
          onStop={onStop}
          onDrag={onStop}
        >
          <Box sx={[orientation === 'vertical' ? sxClasses.vertical : sxClasses.horizontal, sxClasses.bar]} tabIndex={0} ref={swiperRef}>
            <Tooltip title={getLocalizedMessage(displayLanguage, 'swiper.tooltip')}>
              <Box className="handleContainer">
                <HandleIcon sx={sxClasses.handle} className="handleL" />
                <HandleIcon sx={sxClasses.handle} className="handleR" />
              </Box>
            </Tooltip>
          </Box>
        </Draggable>
      </Box>
    );
  }
  return <Box />;
}
