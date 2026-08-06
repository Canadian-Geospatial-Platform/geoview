import { useCallback, useState, useMemo, memo } from 'react';

import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';
import { ClickAwayListener } from '@mui/material';

import { Box, CopyrightIcon, Popper, Paper, IconButton, Typography } from '@/ui';
import type { SxStyles } from '@/ui/style/types';
import { useStoreMapAttribution, useStoreMapInteraction } from '@/core/stores/states/map-state';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import { handleEscapeKey } from '@/core/utils/utilities';
import { logger } from '@/core/utils/logger';
import { getSxClasses } from './attribution-style';

/**
 * Creates the attribution component that displays a popover with map attribution text.
 *
 * Memoized to prevent re-renders when parent components update, since attribution
 * content changes infrequently (only when layers are added/removed).
 *
 * @returns The attribution icon button and popover
 */
export const Attribution = memo((): JSX.Element => {
  // Log
  logger.logTraceRender('components/attribution/attribution');

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();

  /**
   * Builds custom sx classes for the attribution component.
   */
  const memoSxClasses = useMemo((): SxStyles => {
    logger.logTraceUseMemo('ATTRIBUTION - memoSxClasses', theme);
    return getSxClasses(theme);
  }, [theme]);

  // State
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);

  // Store
  const mapId = useStoreGeoViewMapId();
  const interaction = useStoreMapInteraction();
  const mapAttribution = useStoreMapAttribution();

  // Get container
  const mapElem = document.getElementById(`shell-${mapId}`);

  // Set color for type of interaction (dynamic vs static)
  const iconButtonColor =
    interaction === 'dynamic' ? theme.palette.geoViewColor?.bgColor.dark[650] : theme.palette.geoViewColor?.grey.dark[500];

  // Icon button styles with conditional color
  const buttonStyles = {
    ...memoSxClasses.iconButton,
    color: iconButtonColor,
  };

  // Attribution values
  const attributionContent = mapAttribution.map((attribution) => <Typography key={attribution}>{attribution}</Typography>);

  // #region Handlers

  /**
   * Handles toggling the attribution popper.
   */
  const handleOpenPopover = useCallback((event: React.MouseEvent<HTMLButtonElement>): void => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setOpen((prev) => !prev);
  }, []);

  /**
   * Handles closing the attribution popper when clicking away.
   */
  const handleClickAway = useCallback((): void => {
    if (open) setOpen(false);
  }, [open]);

  /**
   * Handles closing the attribution popper.
   */
  const handleClose = useCallback((): void => {
    setOpen(false);
  }, []);

  /**
   * Handles closing the popper when keyboard focus leaves the button.
   */
  const handleBlur = useCallback((): void => {
    // Popper is informational-only, so any blur means focus left the button
    if (open) setOpen(false);
  }, [open]);

  // #endregion Handlers

  return (
    <ClickAwayListener mouseEvent="onMouseDown" touchEvent="onTouchStart" onClickAway={handleClickAway}>
      <Box onBlur={handleBlur}>
        <IconButton
          id={`${mapId}-attribution`}
          onClick={handleOpenPopover}
          className={open ? 'active' : ''}
          aria-label={t('mapctrl.attribution.tooltip')}
          aria-expanded={open}
          aria-controls={open ? `${mapId}-attribution-popup` : undefined}
          aria-haspopup="true"
          tooltipPlacement="top"
          sx={buttonStyles}
        >
          <CopyrightIcon />
        </IconButton>
        <Popper
          id={`${mapId}-attribution-popup`}
          role="region"
          aria-label={t('mapctrl.attribution.tooltip')}
          open={open}
          anchorEl={anchorEl}
          placement="top-end"
          strategy="fixed"
          container={mapElem}
          handleKeyDown={handleEscapeKey}
          onClose={handleClose}
          modifiers={[
            {
              name: 'eventListeners',
              options: { scroll: false, resize: true },
            },
            {
              name: 'preventOverflow',
              enabled: true,
              options: {
                boundary: 'viewport',
                padding: 8,
              },
            },
          ]}
          sx={memoSxClasses.popper}
        >
          <Paper sx={memoSxClasses.popoverPaper}>
            <Box sx={memoSxClasses.content}>{attributionContent}</Box>
          </Paper>
        </Popper>
      </Box>
    </ClickAwayListener>
  );
});
Attribution.displayName = 'Attribution';
