import { useEffect, useRef, useContext } from 'react';

import { useTheme } from '@mui/material/styles';

import { useTranslation } from 'react-i18next';

import { toLonLat } from 'ol/proj';
import { KeyboardPan } from 'ol/interaction';

import { useStore } from 'zustand';
import { getGeoViewStore } from '@/core/stores/stores-managers';

import { MapContext } from '@/core/app-start';

import { Box, Fade, Typography } from '@/ui';
import { TypeMapMouseInfo } from '@/api/events/payloads';

import { getSxClasses } from './crosshair-style';
import { CrosshairIcon } from './crosshair-icon';

/**
 * Create a Crosshair when map is focus with the keyboard so user can click on the map
 * @returns {JSX.Element} the crosshair component
 */
export function Crosshair(): JSX.Element {
  const mapConfig = useContext(MapContext);
  const { mapId } = mapConfig;

  const { t } = useTranslation<string>();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // get store values
  // tracks if the last action was done through a keyboard (map navigation) or mouse (mouse movement)
  const store = getGeoViewStore(mapId);
  const isCrosshairsActive = useStore(store, (state) => state.isCrosshairsActive);
  const projection = useStore(store, (state) => state.mapState.currentProjection);
  const mapCoord = useStore(store, (state) => state.mapState.mapCenterCoordinates);
  const mapElement = useStore(store, (state) => state.mapState.mapElement);

  // use reference as the mapElement from the store is undefined
  // TODO: Find what is going on with mapElement for focus-trap and crosshair and crosshair + map coord for this component
  // ? maybe because simulate click is in an event listener, it is best to use useRef
  const isCrosshairsActiveRef = useRef(isCrosshairsActive);
  isCrosshairsActiveRef.current = isCrosshairsActive;
  const mapCoordRef = useRef(mapCoord);
  mapCoordRef.current = mapCoord;

  // do not use useState for item used inside function only without rendering... use useRef
  const panelButtonId = useRef('');

  let panDelta = 128;

  /**
   * Simulate map mouse click to trigger details panel
   * @function simulateClick
   * @param {KeyboardEvent} evt the keyboard event
   */
  function simulateClick(evt: KeyboardEvent): void {
    if (evt.key === 'Enter') {
      if (isCrosshairsActiveRef.current) {
        // updater store with the lnglat point
        const mapClickCoordinatesFetch: TypeMapMouseInfo = {
          projected: [0, 0],
          pixel: [0, 0],
          lnglat: toLonLat(mapCoordRef.current, `EPSG:${projection}`),
          dragging: false,
        };
        store.setState({
          mapState: { ...store.getState().mapState, mapClickCoordinates: mapClickCoordinatesFetch },
        });
      }
    }
  }

  /**
   * Modify the pixelDelta value for the keyboard pan on Shift arrow up or down
   *
   * @param {KeyboardEvent} evt the keyboard event to trap
   */
  function managePanDelta(evt: KeyboardEvent): void {
    if ((evt.key === 'ArrowDown' && evt.shiftKey) || (evt.key === 'ArrowUp' && evt.shiftKey)) {
      panDelta = evt.key === 'ArrowDown' ? (panDelta -= 10) : (panDelta += 10);
      panDelta = panDelta < 10 ? 10 : panDelta; // minus panDelta reset the value so we need to trap

      // replace the KeyboardPan interraction by a new one
      // const mapElement = mapElementRef.current;
      mapElement.getInteractions().forEach((interactionItem) => {
        if (interactionItem instanceof KeyboardPan) {
          mapElement.removeInteraction(interactionItem);
        }
      });
      mapElement.addInteraction(new KeyboardPan({ pixelDelta: panDelta }));
    }
  }

  useEffect(() => {
    const unsubIsCrosshair = getGeoViewStore(mapId).subscribe(
      (state) => state.isCrosshairsActive,
      (curCrosshair, prevCrosshair) => {
        if (curCrosshair !== prevCrosshair) {
          const mapHTMLElement = mapElement.getTargetElement();

          if (curCrosshair) {
            panelButtonId.current = 'detailsPanel';

            mapHTMLElement.addEventListener('keydown', simulateClick);
            mapHTMLElement.addEventListener('keydown', managePanDelta);
          } else {
            mapHTMLElement.removeEventListener('keydown', simulateClick);
            mapHTMLElement.removeEventListener('keydown', managePanDelta);
          }
        }
      }
    );

    return () => {
      const mapHTMLElement = mapElement.getTargetElement();
      unsubIsCrosshair();
      mapHTMLElement.removeEventListener('keydown', simulateClick);
      mapHTMLElement.removeEventListener('keydown', managePanDelta);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box
      sx={[
        sxClasses.crosshairContainer,
        {
          visibility: isCrosshairsActive ? 'visible' : 'hidden',
        },
      ]}
    >
      <Fade in={isCrosshairsActive}>
        <Box sx={sxClasses.crosshairIcon}>
          <CrosshairIcon />
        </Box>
      </Fade>
      <Box sx={sxClasses.crosshairInfo}>
        <Typography dangerouslySetInnerHTML={{ __html: t('mapctrl.crosshair')! }} />
      </Box>
    </Box>
  );
}
