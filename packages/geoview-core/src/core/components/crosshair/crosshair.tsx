/* eslint-disable react/no-danger */
import { useEffect, useRef, useContext } from 'react';

import { useTheme } from '@mui/material/styles';

import { useTranslation } from 'react-i18next';

import { toLonLat } from 'ol/proj';
import { KeyboardPan } from 'ol/interaction';

import { useStore } from 'zustand';
import { getGeoViewStore } from '@/core/stores/stores-managers';

import { MapContext } from '@/core/app-start';
import { TypeEventHandlerFunction, api } from '@/app';
import { EVENT_NAMES } from '@/api/events/event-types';

import { Box, Fade, Typography } from '@/ui';
import { lngLatPayload, payloadIsAInKeyfocus, PayloadBaseClass } from '@/api/events/payloads';

import { getSxClasses } from './crosshair-style';
import { CrosshairIcon } from './crosshair-icon';

/**
 * Create a Crosshair when map is focus with the keyboard so user can click on the map
 * @returns {JSX.Element} the crosshair component
 */
export function Crosshair(): JSX.Element {
  const mapConfig = useContext(MapContext);
  const { mapId, interaction } = mapConfig;

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
  const mapElementRef = useRef(mapElement);
  const isCrosshairsActiveRef = useRef(false);
  mapElementRef.current = mapElement;
  isCrosshairsActiveRef.current = isCrosshairsActive
  console.log('set crosshair ' + isCrosshairsActive + ' ref ' + isCrosshairsActiveRef.current)

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
        // emit an event with the lnglat point
        const lnglatPoint = toLonLat(mapCoord, `EPSG:${projection}`);
        api.event.emit(lngLatPayload(EVENT_NAMES.MAP.EVENT_MAP_CROSSHAIR_ENTER, mapId, lnglatPoint));
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
      mapElementRef.current.getInteractions().forEach((interactionItem) => {
        if (interactionItem instanceof KeyboardPan) {
          mapElementRef.current.removeInteraction(interactionItem);
        }
      });
      mapElementRef.current.addInteraction(new KeyboardPan({ pixelDelta: panDelta }));
    }
  }

  /**
   * Remove the crosshair for keyboard navigation on map mouse move or blur
   * @function removeCrosshair
   */
  function removeCrosshair(): void {
    // remove simulate click event listener
    mapElementRef.current.getTargetElement().removeEventListener('keydown', simulateClick);
    console.log('set crosshair to false')
    store.setState({state: { ...store.getState(), isCrosshairsActive: false }});
    console.log(store.getState().isCrosshairsActive + ' store crosshair active')
  }

  useEffect(() => {
    // TODO: repair using the store map element
    //! came fromt he map creation on function call
    let eventMapInKeyFocusListenerFunction: TypeEventHandlerFunction;
    //if (mapElement !== undefined) {
      const mapContainer = mapElementRef.current.getTargetElement();

      // eventMapInKeyFocusListenerFunction = (payload: PayloadBaseClass) => {
      //   if (payloadIsAInKeyfocus(payload)) {
      //     if (interaction !== 'static') {
      //       store.setState({ isCrosshairsActive: true });

      //       mapContainer.addEventListener('keydown', simulateClick);
      //       mapContainer.addEventListener('keydown', managePanDelta);
      //       panelButtonId.current = 'detailsPanel';
      //     }
      //   }
      // };

      const unsubIsCrosshair = getGeoViewStore(mapId).subscribe(
        (state) => state.isCrosshairsActive,
        (curCrosshair, prevCrosshair) => {
          if (curCrosshair !== prevCrosshair) {
            store.setState({ isCrosshairsActive: true });

            mapContainer.addEventListener('keydown', simulateClick);
            mapContainer.addEventListener('keydown', managePanDelta);
            panelButtonId.current = 'detailsPanel';
          }
        }
      );

      // on map keyboard focus, add crosshair
      // api.event.on(EVENT_NAMES.MAP.EVENT_MAP_IN_KEYFOCUS, eventMapInKeyFocusListenerFunction, mapId);

      // when map blur, remove the crosshair and click event
      mapContainer.addEventListener('blur', removeCrosshair);
    //}

    return () => {
      if (mapElement !== undefined) {
        // api.event.off(EVENT_NAMES.MAP.EVENT_MAP_IN_KEYFOCUS, mapId, eventMapInKeyFocusListenerFunction);
        const mapContainer = mapElementRef.current.getTargetElement();
        mapContainer.removeEventListener('keydown', simulateClick);
        mapContainer.removeEventListener('keydown', managePanDelta);
        mapContainer.removeEventListener('blur', removeCrosshair);
        unsubIsCrosshair();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box
      sx={sxClasses.crosshairContainer}
      style={{
        visibility: isCrosshairsActiveRef.current ? 'visible' : 'hidden',
      }}
    >
      <Fade in={isCrosshairsActiveRef.current}>
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
