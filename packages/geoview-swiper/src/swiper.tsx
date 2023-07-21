import { TypeJsonObject, TypeWindow } from 'geoview-core';

import Draggable from 'react-draggable';

import { getRenderPixel } from 'ol/render';
import Map from 'ol/Map';
import RenderEvent from 'ol/render/Event';
import BaseLayer from 'ol/layer/Base';
import { VectorImage } from 'ol/layer';
import VectorSource from 'ol/source/Vector';
import { EventTypes } from 'ol/Observable';
import BaseEvent from 'ol/events/Event';

import debounce from 'lodash/debounce';

const sxClasses = {
  layerSwipe: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },

  handle: {
    backgroundColor: 'rgba(50,50,50,0.75)',
    color: '#fff',
    width: '24px',
    height: '24px',
  },

  bar: {
    position: 'absolute',
    backgroundColor: 'rgba(50,50,50,0.75)',
    zIndex: 30,
    boxSizing: 'content-box',
    margin: 0,
    padding: '0!important',
  },

  vertical: {
    width: '8px',
    height: '100%',
    cursor: 'col-resize',
    top: '0px!important',

    '& .handleContainer': {
      position: 'relative',
      width: '58px',
      height: '24px',
      zIndex: 1,
      top: '50%',
      left: '-25px',

      '& .handleR': {
        transform: 'rotate(90deg)',
        float: 'right',
      },

      '& .handleL': {
        transform: 'rotate(90deg)',
        float: 'left',
      },
    },
  },

  horizontal: {
    width: '100%',
    height: '8px',
    cursor: 'col-resize',
    left: '0px!important',

    '& .handleContainer': {
      position: 'relative',
      height: '58px',
      width: '24px',
      zIndex: 1,
      left: '50%',
      top: '-24px',

      '& .handleL': {
        verticalAlign: 'top',
        marginBottom: '8px',
      },
    },
  },
};

type SwiperProps = {
  mapId: string;
  config: ConfigProps;
  translations: TypeJsonObject;
};

type ConfigProps = {
  layers: string[];
  orientation: string;
};

const w = window as TypeWindow;

export function Swiper(props: SwiperProps): JSX.Element {
  const { mapId, config, translations } = props;

  const { cgpv } = w;
  const { api, ui, react } = cgpv;
  const { useEffect, useState, useRef } = react;

  const { Box, Tooltip, HandleIcon } = ui.elements;

  const { displayLanguage } = api.map(mapId!);

  const [map] = useState<Map>(api.map(mapId).map);
  const mapSize = useRef<number[]>(map?.getSize() || [0, 0]);
  const defaultX = mapSize.current[0] / 2;
  const defaultY = mapSize.current[1] / 2;

  const [layersIds] = useState<string[]>(config.layers);
  const [geoviewLayers] = useState(api.map(mapId).layer.geoviewLayers);
  const [olLayers, setOlLayers] = useState<BaseLayer[]>([]);
  const [offset, setOffset] = useState(0);

  const [orientation] = useState(config.orientation);

  const swiperValue = useRef(50);
  const swiperRef = useRef<HTMLElement>();

  /**
   * Pre compose, Pre render event callback
   * @param {Event | BaseEvent} event The pre compose, pre render event
   */
  function prerender(event: Event | BaseEvent) {
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
  }

  /**
   * Post compose, Post render event callback
   * @param {Event | BaseEvent} event the post compose, post render event
   */
  function postcompose(event: Event | BaseEvent) {
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
    const style = window.getComputedStyle(swiperRef!.current!);
    const matrix = new DOMMatrixReadOnly(style.transform);
    return [matrix.m41, matrix.m42];
  };

  /**
   * On Drag and Drag Stop, calculate the clipping extent
   * @param {MouseEvent} evt The mouse event to calculate the clipping
   * @param {Boolean} keyboard true if functio is called from keyboard event
   */
  const onStop = debounce((evt: MouseEvent, keyboard = false) => {
    // get map size
    mapSize.current = map.getSize() || [0, 0];

    // set Swiper % value
    const client =
      orientation === 'vertical'
        ? -map.getTargetElement().getBoundingClientRect().left + evt.clientX
        : -map.getTargetElement().getBoundingClientRect().top + evt.clientY;
    const size = orientation === 'vertical' ? mapSize.current[0] : mapSize.current[1];

    // offset is only used when event is triggered from the mouse event. When triggered from keyboard, we use
    // the swiper bar computed style
    if (!keyboard) {
      swiperValue.current = ((client - offset) / size) * 100;
    } else {
      const position = orientation === 'vertical' ? getSwiperStyle()[0] : getSwiperStyle()[1];
      swiperValue.current = (position / size) * 100;
    }

    // force VectorImage to refresh
    olLayers.forEach((layer: BaseLayer) => {
      if (layer !== null && typeof (layer as VectorImage<VectorSource>).getImageRatio === 'function') layer?.changed();
    });

    map.render();
  }, 100);

  /**
   * On Click, calculate the offset between click location and swiper
   * @param {MouseEvent} evt The mouse event to calculate the offset
   */
  const setMouseOffset = (evt: MouseEvent) => {
    const position =
      orientation === 'vertical'
        ? -map.getTargetElement().getBoundingClientRect().left + evt.clientX
        : -map.getTargetElement().getBoundingClientRect().top + evt.clientY;
    mapSize.current = map.getSize() || [0, 0];

    const size = orientation === 'vertical' ? mapSize.current[0] : mapSize.current[1];
    const offSetOnClick = position - (size * swiperValue.current) / 100;

    setOffset(offSetOnClick);
  };

  /**
   * Set the prerender and postremder events
   *
   * @param {string} layer the layer name
   */
  const setRenderEvents = (layer: string) => {
    const olLayer = geoviewLayers[`${layer}`].gvLayers;
    setOlLayers((prevArray) => [...prevArray, olLayer!]);
    olLayer?.on(['precompose' as EventTypes, 'prerender' as EventTypes], prerender);
    olLayer?.on(['postcompose' as EventTypes, 'postrender' as EventTypes], postcompose);
    // force VectorImage to refresh
    if (olLayer !== null && typeof (olLayer as VectorImage<VectorSource>).getImageRatio === 'function') olLayer?.changed();
  };

  useEffect(() => {
    // set listener for layers in config array
    layersIds.forEach((layer: string) => {
      if (geoviewLayers[`${layer}`] !== undefined) {
        setRenderEvents(layer);
      } else {
        const layerName = layer;
        const renderInterval = setInterval(() => {
          if (geoviewLayers[`${layerName}`] !== undefined) {
            setRenderEvents(layer);
            clearInterval(renderInterval);
          }
        }, 1000);
      }
    });

    return () => {
      layersIds.forEach((layer: string) => {
        const olLayer = geoviewLayers[`${layer}`].gvLayers;
        olLayer?.un(['precompose' as EventTypes, 'prerender' as EventTypes], prerender);
        olLayer?.un(['postcompose' as EventTypes, 'postrender' as EventTypes], postcompose);

        // empty layers array
        setOlLayers([]);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geoviewLayers]);

  /**
   * Update swiper and layers from keyboard CTRL + Arrow key
   * @param {KeyboardEvent} evt The keyboard event to calculate the swiper position
   */
  const updateSwiper = debounce((evt: KeyboardEvent): void => {
    // * there is a know issue when stiching from keyboard to mouse swiper but we can live with it as we are not experctin to face this
    // * offset from mouse method is not working properly anymore

    if (evt.ctrlKey && 'ArrowLeft ArrowRight ArrowUp ArrowDown'.includes(evt.key)) {
      // get swiper bar style then set the move
      const styleValues = getSwiperStyle();
      const move = evt.key === 'ArrowLeft' || evt.key === 'ArrowUp' ? -10 : 10;

      // check if value is outside the window and apply modification
      // eslint-disable-next-line no-nested-ternary
      styleValues[0] = styleValues[0] <= 10 ? 10 : styleValues[0] >= mapSize.current[0] - 10 ? mapSize.current[0] - 10 : styleValues[0];
      // eslint-disable-next-line no-nested-ternary
      styleValues[1] = styleValues[1] <= 10 ? 10 : styleValues[1] >= mapSize.current[1] - 10 ? mapSize.current[1] - 10 : styleValues[1];

      const mouse =
        orientation === 'vertical' ? { clientX: styleValues[0] + move, clientY: 0 } : { clientX: 0, clientY: styleValues[1] + move };

      // apply new style to the bar
      swiperRef!.current!.style.transform =
        orientation === 'vertical' ? `translate(${styleValues[0] + move}px, 0px)` : `translate(0px, ${styleValues[1] + move}px)`;

      // send the onStop event to update layers
      setTimeout(() => onStop(mouse as MouseEvent, true), 75);
    }
  }, 100);

  // set listener for the focus in on swiper bar when on WCAG mode
  // unset listener when focus is out of swiper bar
  swiperRef?.current?.addEventListener('focusin', () => {
    if (document.getElementById(mapId)!.classList.contains('map-focus-trap')) {
      swiperRef?.current?.addEventListener('keydown', updateSwiper);
    }
  });
  swiperRef?.current?.addEventListener('focusout', () => {
    swiperRef?.current?.removeEventListener('keydown', updateSwiper);
  });

  return (
    <Box sx={sxClasses.layerSwipe}>
      <Draggable
        axis={orientation === 'vertical' ? 'x' : 'y'}
        bounds="parent"
        defaultPosition={{ x: orientation === 'vertical' ? defaultX : 0, y: orientation === 'vertical' ? 0 : defaultY }}
        onMouseDown={(e) => setMouseOffset(e)}
        onStop={(e) => {
          onStop(e as MouseEvent);
        }}
        onDrag={(e) => {
          onStop(e as MouseEvent);
        }}
        nodeRef={swiperRef}
      >
        <Box sx={[orientation === 'vertical' ? sxClasses.vertical : sxClasses.horizontal, sxClasses.bar]} tabIndex={0} ref={swiperRef}>
          <Tooltip title={translations[displayLanguage].tooltip}>
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
