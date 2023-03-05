import { TypeJsonObject, TypeWindow } from 'geoview-core';

import { useEffect, useState, useRef } from 'react';
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
  const { api, ui } = cgpv;
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
   * On Drag and Drag Stop, calculate the clipping extent
   * @param {MouseEvent} evt The mouse event to calculate the clipping
   */
  const onStop = debounce((evt: MouseEvent) => {
    // get map size
    mapSize.current = map.getSize() || [0, 0];

    // set Swiper % value
    const client =
      orientation === 'vertical'
        ? -map.getTargetElement().getBoundingClientRect().left + evt.clientX
        : -map.getTargetElement().getBoundingClientRect().top + evt.clientY;
    const size = orientation === 'vertical' ? mapSize.current[0] : mapSize.current[1];
    swiperValue.current = ((client - offset) / size) * 100;

    // force VectorImage to refresh
    olLayers.forEach((layer: BaseLayer) => {
      if (typeof (layer as VectorImage<VectorSource>).getImageRatio === 'function') layer?.changed();
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

  useEffect(() => {
    // set listener for layers in config array
    layersIds.forEach((layer: string) => {
      const olLayer = geoviewLayers[`${layer}`].gvLayers;
      setOlLayers((prevArray) => [...prevArray, olLayer!]);
      olLayer?.on(['precompose' as EventTypes, 'prerender' as EventTypes], prerender);
      olLayer?.on(['postcompose' as EventTypes, 'postrender' as EventTypes], postcompose);

      // force VectorImage to refresh
      if (typeof (olLayer as VectorImage<VectorSource>).getImageRatio === 'function') olLayer?.changed();
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

  return (
    <Box sx={sxClasses.layerSwipe}>
      <Draggable
        axis={`${orientation === 'vertical' ? 'x' : 'y'}`}
        bounds="parent"
        defaultPosition={{ x: orientation === 'vertical' ? defaultX : 0, y: orientation === 'vertical' ? 0 : defaultY }}
        onMouseDown={(e) => setMouseOffset(e)}
        onStop={(e) => {
          onStop(e as MouseEvent);
        }}
        onDrag={(e) => {
          onStop(e as MouseEvent);
        }}
      >
        <Box sx={[orientation === 'vertical' ? sxClasses.vertical : sxClasses.horizontal, sxClasses.bar]} tabIndex={0}>
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
