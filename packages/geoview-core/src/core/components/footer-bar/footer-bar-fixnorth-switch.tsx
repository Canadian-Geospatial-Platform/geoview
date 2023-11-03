import { useTranslation } from 'react-i18next';

import { Switch } from '@/ui';
import { PROJECTION_NAMES } from '@/geo/projection/projection';
import { useUIFooterBarExpanded } from '@/core/stores/store-interface-and-intial-values/ui-state';
import {
  useMapFixNorth,
  useMapNorthArrow,
  useMapProjection,
  useMapStoreActions,
} from '@/core/stores/store-interface-and-intial-values/map-state';

/**
 * Footerbar Fix North Switch component
 *
 * @returns {JSX.Element} the fix north switch
 */
export function FooterbarFixNorthSwitch(): JSX.Element {
  const { t } = useTranslation<string>();

  // get store values
  const expanded = useUIFooterBarExpanded();
  const isNorthEnable = useMapNorthArrow();
  const isFixNorth = useMapFixNorth();
  const mapProjection = useMapProjection();
  const { setFixNorth, setRotation } = useMapStoreActions();

  /**
   * Emit an event to specify the map to rotate to keep north straight
   */
  const fixNorth = (event: React.ChangeEvent<HTMLInputElement>) => {
    // this event will be listen by the north-arrow.tsx component
    setFixNorth(event.target.checked);

    // if unchecked, reset rotation
    if (!event.target.checked) {
      setRotation(0);
    }
  };

  return (
    <div>
      {expanded && `EPSG:${mapProjection}` === PROJECTION_NAMES.LCC && isNorthEnable ? (
        <Switch size="small" onChange={fixNorth} title={t('mapctrl.rotation.fixedNorth')!} checked={isFixNorth} />
      ) : null}
    </div>
  );
}
