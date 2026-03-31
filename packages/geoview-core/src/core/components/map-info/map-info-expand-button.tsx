import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material';
import { ExpandMoreIcon, ExpandLessIcon, IconButton, Box } from '@/ui';
import { logger } from '@/core/utils/logger';

/** Props for the MapInfoExpandButton component. */
interface MapInfoExpandButtonProps {
  /** Callback to toggle the expanded state. */
  onExpand: (value: boolean) => void;
  /** Whether the map info bar is expanded. */
  expanded: boolean;
}

/** Translation key for the expand/collapse tooltip. */
const TOOLTIP_KEY = 'layers.toggleCollapse';

/** Layout styles for the expand button container. */
const BOX_STYLES = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
} as const;

/** Base styles for the expand button. */
const BUTTON_BASE_STYLES = {
  my: '1rem',
} as const;

/**
 * Renders the expand or collapse icon based on state.
 *
 * Memoized to skip re-rendering when the expanded state has not changed.
 */
const ExpandIcon = memo(function ExpandIcon({ expanded }: { expanded: boolean }) {
  return expanded ? <ExpandMoreIcon /> : <ExpandLessIcon />;
});

/**
 * Creates the map information expand button component.
 *
 * Memoized to prevent re-renders when parent updates but props have not changed.
 *
 * @returns The expand button
 */
export const MapInfoExpandButton = memo(function MapInfoExpandButton({ onExpand, expanded }: MapInfoExpandButtonProps): JSX.Element {
  logger.logTraceRender('components/map-info/mmap-info-expand-button');

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();

  const buttonStyles = {
    ...BUTTON_BASE_STYLES,
    color: theme.palette.geoViewColor.bgColor.dark[650],
  };

  /**
   * Handles the expand button click.
   */
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>): void => {
      event.stopPropagation();
      onExpand(!expanded);
    },
    [onExpand, expanded]
  );

  return (
    <Box sx={BOX_STYLES}>
      <IconButton aria-label={t(TOOLTIP_KEY)} tooltipPlacement="top" onClick={handleClick} sx={buttonStyles}>
        <ExpandIcon expanded={expanded} />
      </IconButton>
    </Box>
  );
});
