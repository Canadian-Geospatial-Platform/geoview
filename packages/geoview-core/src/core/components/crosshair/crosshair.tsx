/* eslint-disable react/no-danger */
import { useEffect, useState, useRef, useContext } from 'react';

import { useTranslation } from 'react-i18next';

import makeStyles from '@mui/styles/makeStyles';
import { toLonLat } from 'ol/proj';
import { KeyboardPan } from 'ol/interaction';

import { MapContext } from '@/core/app-start';

import { api } from '@/app';
import { EVENT_NAMES } from '@/api/events/event-types';
import { CrosshairIcon } from './crosshair-icon';

import { Fade } from '@/ui';
import { lngLatPayload, booleanPayload, payloadIsAInKeyfocus } from '@/api/events/payloads';

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
  const projection = api.projection.projections[api.map(mapId).currentProjection];

  // tracks if the last action was done through a keyboard (map navigation) or mouse (mouse movement)
  const [isCrosshairsActive, setCrosshairsActive] = useState(false);

  // do not use useState for item used inside function only without rendering... use useRef
  const isCrosshairsActiveValue = useRef(false);
  const panelButtonId = useRef('');

  let panDelta = 128;

  /**
   * Simulate map mouse click to trigger details panel
   * @function simulateClick
   * @param {KeyboardEvent} evt the keyboard event
   */
  function simulateClick(evt: KeyboardEvent): void {
    if (evt.key === 'Enter') {
      const { map } = api.map(mapId);

      const lnglatPoint = toLonLat(map.getView().getCenter()!, projection);

      if (isCrosshairsActiveValue.current) {
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
      const { map } = api.map(mapId);
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
    const { map } = api.map(mapId);

    // remove simulate click event listener
    map.getTargetElement().removeEventListener('keydown', simulateClick);
    setCrosshairsActive(false);
    isCrosshairsActiveValue.current = false;
    api.event.emit(booleanPayload(EVENT_NAMES.MAP.EVENT_MAP_CROSSHAIR_ENABLE_DISABLE, mapId, false));
  }

  useEffect(() => {
    const { map } = api.map(mapId);

    const mapContainer = map.getTargetElement();

    // on map keyboard focus, add crosshair
    api.event.on(
      EVENT_NAMES.MAP.EVENT_MAP_IN_KEYFOCUS,
      (payload) => {
        if (payloadIsAInKeyfocus(payload)) {
          if (interaction !== 'static') {
            setCrosshairsActive(true);
            isCrosshairsActiveValue.current = true;
            api.event.emit(booleanPayload(EVENT_NAMES.MAP.EVENT_MAP_CROSSHAIR_ENABLE_DISABLE, mapId, true));

            mapContainer.addEventListener('keydown', simulateClick);
            mapContainer.addEventListener('keydown', managePanDelta);
            panelButtonId.current = 'detailsPanel';
          }
        }
      },
      mapId
    );

    // when map blur, remove the crosshair and click event
    mapContainer.addEventListener('blur', removeCrosshair);

    return () => {
      api.event.off(EVENT_NAMES.MAP.EVENT_MAP_IN_KEYFOCUS, mapId);
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
