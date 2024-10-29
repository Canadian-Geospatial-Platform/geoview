import { useEffect } from 'react';

import { useTheme } from '@mui/material';
import { ExpandMoreIcon, ExpandLessIcon, IconButton, Box } from '@/ui';
import { useUIStoreActions, useUIMapInfoExpanded } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { logger } from '@/core/utils/logger';

/**
 * Map Information Expand Button component
 *
 * @returns {JSX.Element} the expand buttons
 */
export function MapInfoExpandButton(): JSX.Element {
  const theme = useTheme();

  // get the expand or collapse from expand button click
  const expanded = useUIMapInfoExpanded();
  const { setMapInfoExpanded } = useUIStoreActions();

  const tooltipAndAria = 'layers.toggleCollapse';

  /**
   * Expand the map information bar
   */
  const expandMapInfo = (): void => {
    setMapInfoExpanded(true);
  };

  /**
   * Collapse map information
   */
  const collapseMapInfo = (): void => {
    setMapInfoExpanded(false);
  };

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('MAP-INFO-EXPAND-BUTTON - mount');

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box>
      <IconButton
        aria-label={tooltipAndAria}
        tooltip={tooltipAndAria}
        onClick={() => (expanded ? collapseMapInfo() : expandMapInfo())}
        sx={{ color: theme.palette.geoViewColor.bgColor.light[800], my: '1rem' }}
      >
        {expanded ? <ExpandMoreIcon /> : <ExpandLessIcon />}
      </IconButton>
    </Box>
  );
}
