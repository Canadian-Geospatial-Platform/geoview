import React, { useContext, useEffect, useState } from 'react';

import { useTranslation } from 'react-i18next';

import { Switch } from '../../../ui';

import { api } from '../../../app';
import { MapContext } from '../../app-start';

import { PROJECTION_NAMES } from '../../../geo/projection/projection';

import { EVENT_NAMES } from '../../../api/events/event-types';
import { booleanPayload, payloadIsABoolean } from '../../../api/events/payloads/boolean-payload';
import { payloadIsAMapViewProjection } from '../../../api/events/payloads/map-view-projection-payload';

/**
 * Footerbar Fix North Switch component
 *
 * @returns {JSX.Element} the fix north switch
 */
export function FooterbarFixNorthSwitch(): JSX.Element {
  const mapConfig = useContext(MapContext);
  const mapId = mapConfig.id;

  const { t } = useTranslation<string>();

  const [expanded, setExpanded] = useState(false);
  const [mapProjection, setMapProjection] = useState(`EPSG:${api.map(mapId).currentProjection}`);
  const [switchChecked, setSwitchChecked] = useState(false);
  const [isNorthEnable] = useState(api.map(mapId).mapProps.components!.indexOf('north-arrow') > -1);

  /**
   * Emit an event to specify the map to rotate to keep north straight
   */
  const fixNorth = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSwitchChecked(!switchChecked);

    // this event will be listen by the north-arrow.tsx component
    api.event.emit(booleanPayload(EVENT_NAMES.MAP.EVENT_MAP_FIX_NORTH, mapId, event.target.checked));

    // if unchecked, reset rotation
    if (!event.target.checked) {
      const { map } = api.map(mapId);
      map.getView().animate({
        rotation: 0,
      });
    }
  };

  useEffect(() => {
    api.event.on(
      EVENT_NAMES.FOOTERBAR.EVENT_FOOTERBAR_EXPAND_COLLAPSE,
      (payload) => {
        if (payloadIsABoolean(payload)) {
          if (payload.handlerName!.includes(mapId)) {
            setExpanded(payload.status);
          }
        }
      },
      mapId
    );

    // listen to geoview-basemap-panel package change projection event
    api.event.on(
      EVENT_NAMES.MAP.EVENT_MAP_VIEW_PROJECTION_CHANGE,
      (payload) => {
        if (payload.handlerName === mapId && payloadIsAMapViewProjection(payload)) {
          setMapProjection(`EPSG:${payload.projection}`);

          // uncheck the control
          if (switchChecked) setSwitchChecked(false);
        }
      },
      mapId
    );

    return () => {
      api.event.off(EVENT_NAMES.FOOTERBAR.EVENT_FOOTERBAR_EXPAND_COLLAPSE, mapId);
      api.event.off(EVENT_NAMES.MAP.EVENT_MAP_VIEW_PROJECTION_CHANGE, mapId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      {expanded && mapProjection === PROJECTION_NAMES.LCC && isNorthEnable ? (
        <Switch size="small" onChange={fixNorth} title={t('mapctrl.rotation.fixedNorth')} checked={switchChecked} />
      ) : null}
    </div>
  );
}
