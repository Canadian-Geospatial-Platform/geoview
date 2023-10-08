import { useContext } from 'react';

import { useTranslation } from 'react-i18next';

import { useStore } from 'zustand';
import { getGeoViewStore } from '@/core/stores/stores-managers';

import { Switch } from '@/ui';
import { MapContext } from '@/core/app-start';
import { PROJECTION_NAMES } from '@/geo/projection/projection';

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
  const expanded = useStore(getGeoViewStore(mapId), (state) => state.footerBarState.expanded);
  const mapElement = useStore(getGeoViewStore(mapId), (state) => state.mapState.mapElement);
  const isNorthEnable = useStore(getGeoViewStore(mapId), (state) => state.mapState.northArrow);
  const isFixNorth = useStore(getGeoViewStore(mapId), (state) => state.mapState.fixNorth);
  const mapProjection = `EPSG:${useStore(getGeoViewStore(mapId), (state) => state.mapState.currentProjection)}`;

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
