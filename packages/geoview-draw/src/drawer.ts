import { getRenderPixel } from 'ol/render';
import RenderEvent from 'ol/render/Event';
import BaseLayer from 'ol/layer/Base';
import { EventTypes } from 'ol/Observable';
import BaseEvent from 'ol/events/Event';

import debounce from 'lodash/debounce';

import { RefObject } from 'geoview-core';
import { logger } from 'geoview-core/src/core/utils/logger';
import { getLocalizedMessage } from 'geoview-core/src/core/utils/utilities';
import { useAppDisplayLanguage } from 'geoview-core/src/core/stores/store-interface-and-intial-values/app-state';
import { useMapLoaded } from 'geoview-core/src/core/stores/store-interface-and-intial-values/map-state';
import { MapViewer } from 'geoview-core/src/geo/map/map-viewer';
import { sxClasses } from './draw-style';

type DrawerProps = {
  viewer: MapViewer;
  config: ConfigProps;
};

type ConfigProps = {
  style: {
      "fill-color": "string",
      "stroke-color": "string",
      "stroke-width": "number",
      "circle-radius": "number",
      "circle-fill-color": "string"
    }
};

export function Swiper(props: DrawerProps): JSX.Element {
  const { viewer, config } = props;

  const { cgpv } = window;
  const { ui, react } = cgpv;
  const { useEffect, useState, useRef } = react;
  const { Box, Tooltip } = ui.elements;

  const drawRef = useRef<HTMLElement>();

  // Get store values
  const layerPaths = useSwiperLayerPaths();
  const displayLanguage = useAppDisplayLanguage();
  const mapLoaded = useMapLoaded();

  // Grab reference
  const drawWindow = drawRef?.current;

  // State
  const [isDrawing, setIsDrawing] = useState(false);
  const [geomType, setGeomType] = useState('Point');
  const [style, setStyle] = useState(config.style);

  const handleStartDrawing = (): void => {
    // set listener for the focus in on swiper bar when on WCAG mode
    draw1 = viewer.map.initDrawInteractions(geomType, geomType);
  };

  const handleStopDrawing = (): void => {
    // unset listener when focus is out of swiper bar
    
  };


  // If any layer paths
  if (layerPaths.length > 0) {
    // Use a swiper
    return (
      <Box>

      </Box>
    );
  }
  return <Box />;
}
