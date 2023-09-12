/* eslint-disable react/no-danger */
import { useEffect, useRef, useContext } from 'react';

import { useTranslation } from 'react-i18next';

import makeStyles from '@mui/styles/makeStyles';
import { toLonLat } from 'ol/proj';
import { KeyboardPan } from 'ol/interaction';

import { useStore } from 'zustand';
import { MapContext } from '@/core/app-start';

import { api } from '@/app';
import { EVENT_NAMES } from '@/api/events/event-types';
import { CrosshairIcon } from './crosshair-icon';

import { Fade } from '@/ui';
import { lngLatPayload, payloadIsAInKeyfocus, PayloadBaseClass } from '@/api/events/payloads';
import { getGeoViewStore } from '@/core/stores/stores-managers';

const useStyles = makeStyles((theme) => ({
  crosshairContainer: {
    position: 'absolute',
    top: theme.spacing(0),
    right: theme.spacing(0),
    left: theme.spacing(0),
    bottom: theme.spacing(0),
    paddingBottom: theme.spacing(6),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    'pointer-events': 'none !important',
    zIndex: theme.zIndex.olControl,
  },
  crosshairInfo: {
    position: 'absolute',
    top: theme.spacing(0),
    right: theme.spacing(0),
    left: theme.spacing(0),
    height: 'calc(1em + 8px)',
    padding: theme.spacing(2, 1, 4, 1),
    backgroundColor: 'rgba(228, 227, 227, 0.9)',
    '& span': {
      paddingLeft: 70,
    },
  },
  crosshairIcon: {
    width: theme.overrides.crosshairIcon.size.width,
    height: theme.overrides.crosshairIcon?.size.height,
  },
}));

/**
 * Create a Crosshair when map is focus with the keyboard so user can click on the map
 * @returns {JSX.Element} the crosshair component
 */
export function Crosshair(): JSX.Element {
  const classes = useStyles();
  const { t } = useTranslation<string>();

  const mapConfig = useContext(MapContext);
  const { mapId, interaction } = mapConfig;
  const projection = api.projection.projections[api.maps[mapId].currentProjection];

  const store = getGeoViewStore(mapId);
  const { setCrosshairsActive, isCrosshairsActive } = useStore(store, (state) => ({
    setCrosshairsActive: state.setCrosshairsActive,
    isCrosshairsActive: state.isCrosshairsActive,
  }));

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
      const { map } = api.maps[mapId];

      const lnglatPoint = toLonLat(map.getView().getCenter()!, projection);

      if (isCrosshairsActive) {
        // emit an event with the lnglat point
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
      const { map } = api.maps[mapId];
      map.getInteractions().forEach((interactionItem) => {
        if (interactionItem instanceof KeyboardPan) {
          map.removeInteraction(interactionItem);
        }
      });
      map.addInteraction(new KeyboardPan({ pixelDelta: panDelta }));
    }
  }

  /**
   * Remove the crosshair for keyboard navigation on map mouse move or blur
   * @function removeCrosshair
   */
  function removeCrosshair(): void {
    const { map } = api.maps[mapId];

    // remove simulate click event listener
    map.getTargetElement().removeEventListener('keydown', simulateClick);
    setCrosshairsActive(false);
  }

  useEffect(() => {
    const { map } = api.maps[mapId];

    const mapContainer = map.getTargetElement();

    const eventMapInKeyFocusListenerFunction = (payload: PayloadBaseClass) => {
      if (payloadIsAInKeyfocus(payload)) {
        if (interaction !== 'static') {
          setCrosshairsActive(true);

          mapContainer.addEventListener('keydown', simulateClick);
          mapContainer.addEventListener('keydown', managePanDelta);
          panelButtonId.current = 'detailsPanel';
        }
      }
    };

    // on map keyboard focus, add crosshair
    api.event.on(EVENT_NAMES.MAP.EVENT_MAP_IN_KEYFOCUS, eventMapInKeyFocusListenerFunction, mapId);

    // when map blur, remove the crosshair and click event
    mapContainer.addEventListener('blur', removeCrosshair);

    return () => {
      api.event.off(EVENT_NAMES.MAP.EVENT_MAP_IN_KEYFOCUS, mapId, eventMapInKeyFocusListenerFunction);
      mapContainer.removeEventListener('keydown', simulateClick);
      mapContainer.removeEventListener('keydown', managePanDelta);
      mapContainer.removeEventListener('keydown', removeCrosshair);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={classes.crosshairContainer}
      style={{
        visibility: isCrosshairsActive ? 'visible' : 'hidden',
      }}
    >
      <Fade in={isCrosshairsActive}>
        <div className={classes.crosshairIcon}>
          <CrosshairIcon />
        </div>
      </Fade>
      <div className={classes.crosshairInfo}>
        <span dangerouslySetInnerHTML={{ __html: t('mapctrl.crosshair')! }} />
      </div>
    </div>
  );
}
