import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material';
import { ExpandMoreIcon, ExpandLessIcon, IconButton, Box } from '@/ui';
import { logger } from '@/core/utils/logger';

interface MapInfoExpandButtonProps {
  onExpand: (value: boolean) => void;
  expanded: boolean;
}

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
export const MapInfoExpandButton = memo(function MapInfoExpandButton({ onExpand, expanded }: MapInfoExpandButtonProps): JSX.Element {
  logger.logTraceRender('components/map-info/mmap-info-expand-button');

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();

  const buttonStyles = {
    ...BUTTON_BASE_STYLES,
    color: theme.palette.geoViewColor.bgColor.light[800],
  };

  const handleClick = useCallback(() => {
    onExpand(!expanded);
  }, [onExpand, expanded]);

  return (
    <Box sx={BOX_STYLES}>
      <IconButton aria-label={t(TOOLTIP_KEY)!} tooltip={t(TOOLTIP_KEY)!} tooltipPlacement="top" onClick={handleClick} sx={buttonStyles}>
        <ExpandIcon expanded={expanded} />
      </IconButton>
    </Box>
  );
});
