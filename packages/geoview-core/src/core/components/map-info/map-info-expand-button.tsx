import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';

import { ExpandMoreIcon, ExpandLessIcon, IconButton, Box } from '@/ui';
import { getSxClasses } from './map-info-expand-button-style';
import { logger } from '@/core/utils/logger';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';

/** Props for the MapInfoExpandButton component. */
interface MapInfoExpandButtonProps {
  /** Callback to toggle the expanded state. */
  onExpand: (value: boolean) => void;
  /** Whether the map info bar is expanded. */
  expanded: boolean;
}

/** Translation key for the expand/collapse tooltip. */
const TOOLTIP_KEY = 'layers.toggleCollapse';

/**
 * Renders the expand or collapse icon based on state.
 *
 * Memoized to skip re-rendering when the expanded state has not changed.
 */
const ExpandIcon = memo(({ expanded }: { expanded: boolean }): JSX.Element => {
  return expanded ? <ExpandMoreIcon /> : <ExpandLessIcon />;
});
ExpandIcon.displayName = 'ExpandIcon';

/**
 * Creates the map information expand button component.
 *
 * Memoized to prevent re-renders when parent updates but props have not changed.
 *
 * @returns The expand button
 */
export const MapInfoExpandButton = memo(({ onExpand, expanded }: MapInfoExpandButtonProps): JSX.Element => {
  logger.logTraceRender('components/map-info/map-info-expand-button');

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  /**
   * Builds the map info expand button styles.
   */
  const memoSxClasses = useMemo((): ReturnType<typeof getSxClasses> => {
    logger.logTraceUseMemo('MAP-INFO-EXPAND-BUTTON - memoSxClasses', theme);
    return getSxClasses(theme);
  }, [theme]);
  const mapId = useStoreGeoViewMapId();

  // #region Handlers

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

  // #endregion Handlers

  return (
    <Box sx={memoSxClasses.container}>
      <IconButton
        aria-label={t(TOOLTIP_KEY)}
        aria-expanded={expanded}
        aria-controls={`${mapId}-mapInfo`}
        tooltipPlacement="top"
        onClick={handleClick}
        sx={memoSxClasses.button}
      >
        <ExpandIcon expanded={expanded} />
      </IconButton>
    </Box>
  );
});
MapInfoExpandButton.displayName = 'MapInfoExpandButton';
