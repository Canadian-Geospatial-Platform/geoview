import Draggable from 'react-draggable';

import { getRenderPixel } from 'ol/render';
import RenderEvent from 'ol/render/Event';
import BaseLayer from 'ol/layer/Base';
import { EventTypes } from 'ol/Observable';
import BaseEvent from 'ol/events/Event';

import debounce from 'lodash/debounce';

import { RefObject } from 'geoview-core';
import { useSwiperLayerPaths } from 'geoview-core/src/core/stores/store-interface-and-intial-values/swiper-state';
import { logger } from 'geoview-core/src/core/utils/logger';
import { getLocalizedMessage } from 'geoview-core/src/core/utils/utilities';
import { useAppDisplayLanguage } from 'geoview-core/src/core/stores/store-interface-and-intial-values/app-state';
import { useMapVisibleLayers } from 'geoview-core/src/core/stores/store-interface-and-intial-values/map-state';
import { MapViewer } from 'geoview-core/src/geo/map/map-viewer';
import { sxClasses } from './swiper-style';

type SwiperProps = {
  viewer: MapViewer;
  config: ConfigProps;
};

type ConfigProps = {
  layers: string[];
  orientation: string;
};

export function Swiper(props: SwiperProps): JSX.Element {
  const { viewer, config } = props;

  const { cgpv } = window;
  const { ui, react } = cgpv;
  const { useEffect, useState, useRef, useCallback } = react;
  const { Box, Tooltip, HandleIcon } = ui.elements;
  const { orientation } = config;

  const mapSize = useRef<number[]>(viewer.map?.getSize() || [0, 0]);
  const swiperValue = useRef(50);
  const swiperRef = useRef<HTMLElement>();

  const [olLayers, setOlLayers] = useState<BaseLayer[]>([]);
  const [xPosition, setXPosition] = useState(mapSize.current[0] / 2);
  const [yPosition, setYPosition] = useState(mapSize.current[1] / 2);

  // Get store values
  const layerPaths = useSwiperLayerPaths();
  const displayLanguage = useAppDisplayLanguage();
  const visibleLayers = useMapVisibleLayers();

  /**
   * Pre compose, Pre render event callback
   * @param {Event | BaseEvent} event The pre compose, pre render event
   */
  const prerender = useCallback(
    (event: Event | BaseEvent) => {
      // Log
      logger.logTraceUseCallback('GEOVIEW-SWIPER - prerender', event);

      const evt = event as RenderEvent;
      const ctx: CanvasRenderingContext2D = evt.context! as CanvasRenderingContext2D;
      const width = ((mapSize.current[0] + 6) * swiperValue.current) / 100;
      const height = ((mapSize.current[1] + 6) * swiperValue.current) / 100;

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
   * @param {Event | BaseEvent} event the post compose, post render event
   */
  function postcompose(event: Event | BaseEvent): void {
    const evt = event as RenderEvent;
    const ctx: CanvasRenderingContext2D | WebGLRenderingContext = evt.context! as CanvasRenderingContext2D | WebGLRenderingContext;
    if (ctx instanceof WebGLRenderingContext) {
      if (evt.type === 'postrender') {
        ctx.disable(ctx.SCISSOR_TEST);
      }
    } else if (evt.target.getClassName && evt.target.getClassName() !== 'ol-layer' && evt.target.get('declutter')) {
      // restore context when decluttering is done (ol>=6)
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
   * @returns {Number[]} the array of value for x and y position fot the swiper bar
   */
  const getSwiperStyle = (): number[] => {
    const style = window.getComputedStyle(swiperRef.current!);
    const matrix = new DOMMatrixReadOnly(style.transform);
    return [matrix.m41, matrix.m42];
  };

  /**
   * On Drag and Drag Stop, calculate the clipping extent
   * @param {MouseEvent} evt The mouse event to calculate the clipping
   */
  const onStop = debounce(() => {
    if (layerPaths.length) {
      // get map size
      mapSize.current = viewer.map.getSize() || [0, 0];
      const size = orientation === 'vertical' ? mapSize.current[0] : mapSize.current[1];
      const position = orientation === 'vertical' ? getSwiperStyle()[0] : getSwiperStyle()[1];
      swiperValue.current = (position / size) * 100;

      // Update the position
      if (orientation === 'vertical') setXPosition(position);
      if (orientation === 'vertical') setYPosition(position);

      // Force refresh
      olLayers.forEach((layer: BaseLayer) => {
        layer.changed();
      });
    }
  }, 100);

  /**
   * Update swiper and layers from keyboard CTRL + Arrow key
   * @param {KeyboardEvent} evt The keyboard event to calculate the swiper position
   */
  const updateSwiper = debounce((evt: KeyboardEvent): void => {
    // * there is a know issue when stiching from keyboard to mouse swiper but we can live with it as we are not expecting to face this
    // * offset from mouse method is not working properly anymore
    if (evt.ctrlKey && 'ArrowLeft ArrowRight ArrowUp ArrowDown'.includes(evt.key) && layerPaths.length) {
      // get swiper bar style then set the move
      const styleValues = getSwiperStyle();
      const move = evt.key === 'ArrowLeft' || evt.key === 'ArrowUp' ? -10 : 10;

      // check if value is outside the window and apply modification
      // eslint-disable-next-line no-nested-ternary
      styleValues[0] = styleValues[0] <= 10 ? 10 : styleValues[0] >= mapSize.current[0] - 10 ? mapSize.current[0] - 10 : styleValues[0];
      // eslint-disable-next-line no-nested-ternary
      styleValues[1] = styleValues[1] <= 10 ? 10 : styleValues[1] >= mapSize.current[1] - 10 ? mapSize.current[1] - 10 : styleValues[1];

      // apply new style to the bar
      swiperRef!.current!.style.transform =
        orientation === 'vertical' ? `translate(${styleValues[0] + move}px, 0px)` : `translate(0px, ${styleValues[1] + move}px)`;

      // send the onStop event to update layers
      setTimeout(() => onStop(), 75);
    }
  }, 100);

  /**
   * Attaches necessary swiper events to the given layer path layer
   * @param {string} layerPath The layer path of the layer to attach swiping events to
   */
  const attachLayerEventsOnPath = useCallback(
    async (layerPath: string) => {
      try {
        // Get the layer at the layer path
        const olLayer = await viewer.layer.getOLLayerAsync(layerPath);
        if (olLayer) {
          // Set the OL layers
          setOlLayers((prevArray: BaseLayer[]) => [...prevArray, olLayer]);

          // Wire events on the layer
          olLayer.on(['precompose' as EventTypes, 'prerender' as EventTypes], prerender);
          olLayer.on(['postcompose' as EventTypes, 'postrender' as EventTypes], postcompose);

          // Force refresh
          olLayer.changed();
        } else {
          // Log
          logger.logError('SWIPER - Failed to find layer to attach layer events', layerPath);
        }
      } catch (error) {
        // Log
        logger.logError('SWIPER - Failed to attach layer events', viewer.layer?.geoviewLayers, layerPath, error);
      }
    },
    [viewer, prerender]
  );

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('GEOVIEW-SWIPER - layerPaths', layerPaths);

    // Get all associated layerPaths in case provided path is a layer ID or group layer path
    const associatedLayerPaths = layerPaths
      .map((layerPath) => visibleLayers.filter((visibleLayerPath) => visibleLayerPath.includes(layerPath)))
      .flat();

    // For each layer path
    associatedLayerPaths.forEach((layerPath: string) => {
      // Wire events on the layer path
      attachLayerEventsOnPath(layerPath).catch((error) => {
        // Log
        logger.logPromiseFailed('attachLayerEventsOnPath in useEffect in Swiper', error);
      });
    });

    return () => {
      // Log
      logger.logTraceUseEffectUnmount('GEOVIEW-SWIPER - layerPaths', layerPaths);

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
        } catch (error) {
          // Log
          logger.logError('SWIPER - Failed to un-attach layer events', layerPath, error);
        }
      });

      // Empty layers array
      setOlLayers([]);
    };
  }, [viewer, layerPaths, attachLayerEventsOnPath, prerender, visibleLayers]);

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('GEOVIEW-SWIPER - mount', viewer.mapId);

    // Grab reference
    const theSwiper = swiperRef?.current;

    const handleFocusIn = (): void => {
      // set listener for the focus in on swiper bar when on WCAG mode
      if (document.getElementById(viewer.mapId)!.classList.contains('map-focus-trap')) {
        theSwiper?.addEventListener('keydown', updateSwiper);
      }
    };

    const handleFocusOut = (): void => {
      // unset listener when focus is out of swiper bar
      theSwiper?.removeEventListener('keydown', updateSwiper);
    };

    // Wire events
    theSwiper?.addEventListener('focusin', handleFocusIn);
    theSwiper?.addEventListener('focusout', handleFocusOut);

    return () => {
      // Log
      logger.logTraceUseEffectUnmount('GEOVIEW-SWIPER - unmount', viewer.mapId);

      // Unwire events
      theSwiper?.removeEventListener('focusout', handleFocusOut);
      theSwiper?.removeEventListener('focusin', handleFocusIn);
    };
  }, [viewer.mapId, updateSwiper]);

  // If any layer paths
  if (layerPaths.length > 0) {
    // Use a swiper
    return (
      <Box sx={sxClasses.layerSwipe}>
        <Draggable
          axis={orientation === 'vertical' ? 'x' : 'y'}
          bounds="parent"
          defaultPosition={{ x: orientation === 'vertical' ? xPosition : 0, y: orientation === 'vertical' ? 0 : yPosition }}
          onStop={() => onStop()}
          onDrag={() => onStop()}
          nodeRef={swiperRef as RefObject<HTMLElement>}
        >
          <Box sx={[orientation === 'vertical' ? sxClasses.vertical : sxClasses.horizontal, sxClasses.bar]} tabIndex={0} ref={swiperRef}>
            <Tooltip title={getLocalizedMessage('swiper.tooltip', displayLanguage)}>
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
