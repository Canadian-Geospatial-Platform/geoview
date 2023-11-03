import { useContext } from 'react';

import { useTranslation } from 'react-i18next';

import { useStore } from 'zustand';
import { getGeoViewStore } from '@/core/stores/stores-managers';

import { Switch } from '@/ui';
import { MapContext } from '@/core/app-start';
import { PROJECTION_NAMES } from '@/geo/projection/projection';
import { useUIFooterBarExpanded } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { useMapElement, useMapProjection } from '@/core/stores/store-interface-and-intial-values/map-state';

/**
 * Footerbar Fix North Switch component
 *
 * @returns {JSX.Element} the fix north switch
 */
export function FooterbarFixNorthSwitch(): JSX.Element {
  const mapConfig = useContext(MapContext);
  const { mapId } = mapConfig;

  const { t } = useTranslation<string>();

  // get the expand or collapse from store
  const expanded = useUIFooterBarExpanded();
  const mapElement = useMapElement();
  const isNorthEnable = useStore(getGeoViewStore(mapId), (state) => state.mapState.northArrow);
  const isFixNorth = useStore(getGeoViewStore(mapId), (state) => state.mapState.fixNorth);
  const mapProjection = `EPSG:${useMapProjection()}`;

  /**
   * Emit an event to specify the map to rotate to keep north straight
   */
  const fixNorth = (event: React.ChangeEvent<HTMLInputElement>) => {
    // this event will be listen by the north-arrow.tsx component
    getGeoViewStore(mapId).setState({
      mapState: { ...getGeoViewStore(mapId).getState().mapState, fixNorth: event.target.checked },
    });

    // if unchecked, reset rotation
    if (!event.target.checked) {
      mapElement.getView().animate({
        rotation: 0,
      });
    }
  };

  return (
    <div>
      {expanded && mapProjection === PROJECTION_NAMES.LCC && isNorthEnable ? (
        <Switch size="small" onChange={fixNorth} title={t('mapctrl.rotation.fixedNorth')!} checked={isFixNorth} />
      ) : null}
    </div>
  );
}
