import { memo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';

import { Switch, Box } from '@/ui';
import { Projection } from '@/geo/utils/projection';
import {
  useMapFixNorth,
  useMapNorthArrow,
  useMapProjection,
  useMapStoreActions,
} from '@/core/stores/store-interface-and-intial-values/map-state';
import { logger } from '@/core/utils/logger';

interface MapInfoFixNorthSwitchProps {
  expanded: boolean;
}

// Constants outside component to prevent recreating every render
const BOX_STYLES = {
  minWidth: '30px',
  display: 'flex',
  alignItems: 'center',
} as const;

/**
 * Switch component for controlling map north orientation
 */
const NorthSwitch = memo(function NorthSwitch({
  isFixNorth,
  onToggle,
  tooltipText,
  visible,
}: {
  isFixNorth: boolean;
  onToggle: (event: React.ChangeEvent<HTMLInputElement>) => void;
  tooltipText: string;
  visible: boolean;
}) {
  return visible ? <Switch size="small" onChange={onToggle} label={tooltipText} checked={isFixNorth} /> : null;
});

/**
 * Map Information Fix North Switch component
 *
 * @returns {JSX.Element} the fix north switch
 */
// Memoizes entire component, preventing re-renders if props haven't changed
export const MapInfoFixNorthSwitch = memo(function MapInfoFixNorthSwitch({ expanded }: MapInfoFixNorthSwitchProps): JSX.Element {
  logger.logTraceRender('components/map-info/map-info-fixnorth-switch');

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const deviceSizeMedUp = useMediaQuery(theme.breakpoints.down('md'));

  // Store
  const isNorthEnable = useMapNorthArrow();
  const isFixNorth = useMapFixNorth();
  const mapProjection = useMapProjection();
  const { setFixNorth, setRotation } = useMapStoreActions();

  const isLCCProjection = `EPSG:${mapProjection}` === Projection.PROJECTION_NAMES.LCC;
  const showSwitch = expanded && isLCCProjection && isNorthEnable;

  // Callbacks
  const handleFixNorth = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      const isChecked = event.target.checked;
      setFixNorth(isChecked);

      if (!isChecked) {
        setRotation(0);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // State setters are stable, no need for dependencies
  );

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('MAP-INFO-FIXNORTH-SWITCH - deviceSizeMedUp', deviceSizeMedUp);

    if (deviceSizeMedUp) {
      setFixNorth(false);
    }
  }, [deviceSizeMedUp, setFixNorth]);

  return (
    <Box sx={BOX_STYLES}>
      <NorthSwitch isFixNorth={isFixNorth} onToggle={handleFixNorth} tooltipText={t('mapctrl.rotation.fixedNorth')} visible={showSwitch} />
    </Box>
  );
});
