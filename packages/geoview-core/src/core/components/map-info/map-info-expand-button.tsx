import { memo, useCallback, useEffect } from 'react';

import { useTheme } from '@mui/material';
import { ExpandMoreIcon, ExpandLessIcon, IconButton, Box } from '@/ui';
import { useUIStoreActions, useUIMapInfoExpanded } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { logger } from '@/core/utils/logger';

// Constants outside component to prevent recreating every render
const TOOLTIP_KEY = 'layers.toggleCollapse';

const BOX_STYLES = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
} as const;

const BUTTON_BASE_STYLES = {
  my: '1rem',
} as const;

/**
 * Expand icon component
 */
const ExpandIcon = memo(function ExpandIcon({ expanded }: { expanded: boolean }) {
  return expanded ? <ExpandMoreIcon /> : <ExpandLessIcon />;
});

/**
 * Map Information Expand Button component
 *
 * @returns {JSX.Element} the expand buttons
 */
// Memoizes entire component, preventing re-renders if props haven't changed
export const MapInfoExpandButton = memo(function MapInfoExpandButton(): JSX.Element {
  logger.logTraceRender('components/map-info/mmap-info-expand-button');

  // Hooks
  const theme = useTheme();

  // Store
  const expanded = useUIMapInfoExpanded();
  const { setMapInfoExpanded } = useUIStoreActions();

  const buttonStyles = {
    ...BUTTON_BASE_STYLES,
    color: theme.palette.geoViewColor.bgColor.light[800],
  };

  // Callback expand/collapse
  const expandMapInfo = useCallback(
    (): void => {
      setMapInfoExpanded(true);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // State setters are stable, no need for dependencies
  );
  const collapseMapInfo = useCallback(
    (): void => {
      setMapInfoExpanded(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // State setters are stable, no need for dependencies
  );

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('MAP-INFO-EXPAND-BUTTON - mount');
  }, []);

  return (
    <Box sx={BOX_STYLES}>
      <IconButton
        aria-label={TOOLTIP_KEY}
        tooltip={TOOLTIP_KEY}
        onClick={() => (expanded ? collapseMapInfo() : expandMapInfo())}
        sx={buttonStyles}
      >
        <ExpandIcon expanded={expanded} />
      </IconButton>
    </Box>
  );
});
