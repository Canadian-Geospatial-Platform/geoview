import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';

import { Switch, Box } from '@/ui';
import { Projection } from '@/geo/utils/projection';
import { useUIMapInfoExpanded } from '@/core/stores/store-interface-and-intial-values/ui-state';
import {
  useMapFixNorth,
  useMapNorthArrow,
  useMapProjection,
  useMapStoreActions,
} from '@/core/stores/store-interface-and-intial-values/map-state';
import { logger } from '@/core/utils/logger';

/**
 * Map Information Fix North Switch component
 *
 * @returns {JSX.Element} the fix north switch
 */
export function MapInfoFixNorthSwitch(): JSX.Element {
  const { t } = useTranslation<string>();

  const theme = useTheme();
  const deviceSizeMedUp = useMediaQuery(theme.breakpoints.down('md'));

  // get store values
  const expanded = useUIMapInfoExpanded();
  const isNorthEnable = useMapNorthArrow();
  const isFixNorth = useMapFixNorth();
  const mapProjection = useMapProjection();
  const { setFixNorth, setRotation } = useMapStoreActions();

  /**
   * Emit an event to specify the map to rotate to keep north straight
   */
  const fixNorth = (event: React.ChangeEvent<HTMLInputElement>): void => {
    // this event will be listen by the north-arrow.tsx component
    setFixNorth(event.target.checked);

    // if unchecked, reset rotation
    if (!event.target.checked) {
      setRotation(0);
    }
  };

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('MAP-INFO-FIXNORTH-SWITCH - deviceSizeMedUp', deviceSizeMedUp);

    if (deviceSizeMedUp) {
      setFixNorth(false);
    }
  }, [deviceSizeMedUp, setFixNorth]);

  return (
    <Box
      sx={{
        [theme.breakpoints.down('md')]: {
          display: 'none',
        },
      }}
    >
      {expanded && `EPSG:${mapProjection}` === Projection.PROJECTION_NAMES.LCC && isNorthEnable ? (
        <Switch size="small" onChange={fixNorth} title={t('mapctrl.rotation.fixedNorth')!} checked={isFixNorth} />
      ) : null}
    </Box>
  );
}
