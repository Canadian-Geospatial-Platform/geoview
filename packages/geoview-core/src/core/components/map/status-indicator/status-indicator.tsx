import { memo, useMemo } from 'react';

import { Box, Typography } from '@/ui';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

import { useStoreAppIsCrosshairsActive } from '@/core/stores/states/app-state';
import { useStoreMapStatusIndicators } from '@/core/stores/states/map-state';

import { getSxClasses, getBadgeStyle } from './status-indicator-styles';
import { logger } from '@/core/utils/logger';

/**
 * Displays status indicator messages in a stacked layout.
 *
 * Automatically positions below the crosshair message when crosshairs are active.
 *
 * @returns The map status indicators component, or null if no indicators
 */
export const MapStatusIndicators = memo(function MapStatusIndicators(): JSX.Element | null {
  logger.logTraceRender('components/map/status-indicator');

  const { t } = useTranslation();
  const theme = useTheme();
  const indicators = useStoreMapStatusIndicators();
  const isCrosshairsActive = useStoreAppIsCrosshairsActive();

  /**
   * Memoizes the container styles.
   */
  const sxClasses = useMemo(() => getSxClasses(theme, isCrosshairsActive), [theme, isCrosshairsActive]);
  const hasIndicators = Object.keys(indicators).length > 0;

  return (
    <Box sx={{ ...sxClasses.container, ...(!hasIndicators && { display: 'none' }) }}>
      {Object.entries(indicators).map(([id, indicator]) => (
        <Box key={id} sx={getBadgeStyle(theme, indicator.type)}>
          <Typography variant="caption" sx={{ color: 'inherit' }}>
            {t(indicator.message)}
          </Typography>
        </Box>
      ))}
    </Box>
  );
});
