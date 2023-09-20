import React, { useContext, useEffect, useState } from 'react';

import { useTranslation } from 'react-i18next';

import { useStore } from 'zustand';
import { Switch } from '@/ui';

import { api } from '@/app';
import { MapContext } from '@/core/app-start';

import { PROJECTION_NAMES } from '@/geo/projection/projection';

import { EVENT_NAMES } from '@/api/events/event-types';
import { PayloadBaseClass, booleanPayload, payloadIsAMapViewProjection } from '@/api/events/payloads';

import { getGeoViewStore } from '@/core/stores/stores-managers';

/**
 * Footerbar Fix North Switch component
 *
 * @returns {JSX.Element} the fix north switch
 */
export function FooterbarFixNorthSwitch(): JSX.Element {
  const mapConfig = useContext(MapContext);
  const { mapId } = mapConfig;

  const { t } = useTranslation<string>();

  const [mapProjection, setMapProjection] = useState(`EPSG:${api.maps[mapId].currentProjection}`);
  const [switchChecked, setSwitchChecked] = useState(false);
  const [isNorthEnable] = useState(api.maps[mapId].mapFeaturesConfig.components!.indexOf('north-arrow') > -1);

  // get the expand or collapse from store
  const expanded = useStore(getGeoViewStore(mapId), (state) => state.footerBarState.expanded);

  /**
   * Emit an event to specify the map to rotate to keep north straight
   */
  const fixNorth = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSwitchChecked(!switchChecked);

    // this event will be listen by the north-arrow.tsx component
    api.event.emit(booleanPayload(EVENT_NAMES.MAP.EVENT_MAP_FIX_NORTH, mapId, event.target.checked));

    // if unchecked, reset rotation
    if (!event.target.checked) {
      const { map } = api.maps[mapId];
      map.getView().animate({
        rotation: 0,
      });
    }
  };

  const eventMapViewProjectionChangeListenerFunction = (payload: PayloadBaseClass) => {
    if (payloadIsAMapViewProjection(payload)) {
      setMapProjection(`EPSG:${payload.projection}`);

      // uncheck the control
      if (switchChecked) setSwitchChecked(false);
    }
  };

  useEffect(() => {
    // listen to geoview-basemap-panel package change projection event
    api.event.on(EVENT_NAMES.MAP.EVENT_MAP_VIEW_PROJECTION_CHANGE, eventMapViewProjectionChangeListenerFunction, mapId);

    return () => {
      api.event.off(EVENT_NAMES.MAP.EVENT_MAP_VIEW_PROJECTION_CHANGE, mapId, eventMapViewProjectionChangeListenerFunction);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      {expanded && mapProjection === PROJECTION_NAMES.LCC && isNorthEnable ? (
        <Switch size="small" onChange={fixNorth} title={t('mapctrl.rotation.fixedNorth')!} checked={switchChecked} />
      ) : null}
    </div>
  );
}
