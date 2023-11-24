import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';

import { Switch, Box } from '@/ui';
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
  const theme = useTheme();
  const deviceSizeMedUp = useMediaQuery(theme.breakpoints.down('md'));

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

  useEffect(() => {
    if (deviceSizeMedUp) {
      setFixNorth(false);
    }
  }, [deviceSizeMedUp]);

  return (
    <Box
      sx={{
        [theme.breakpoints.down('md')]: {
          display: 'none',
        },
      }}
    >
      {expanded && `EPSG:${mapProjection}` === PROJECTION_NAMES.LCC && isNorthEnable ? (
        <Switch size="small" onChange={fixNorth} title={t('mapctrl.rotation.fixedNorth')!} checked={isFixNorth} />
      ) : null}
    </Box>
  );
}
