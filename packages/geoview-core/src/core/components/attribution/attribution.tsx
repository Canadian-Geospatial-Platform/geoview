import { useCallback, useState, memo } from 'react';

import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';
import { ClickAwayListener } from '@mui/material';

import { Box, CopyrightIcon, Popper, Paper, IconButton, Typography } from '@/ui';
import { useStoreMapAttribution, useStoreMapInteraction } from '@/core/stores/store-interface-and-intial-values/map-state';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import { logger } from '@/core/utils/logger';

/** Styles for the popper content box. */
const BOX_STYLES = { padding: '1rem', width: '28.125rem' } as const;

/** Base styles for the attribution icon button. */
const ICON_BUTTON_BASE_STYLES = {
  width: '30px',
  height: '30px',
  my: '1rem',
  margin: 'auto',
} as const;

/**
 * Attribution component that displays a popover with map attribution text.
 *
 * @returns The attribution icon button and popover
 */
// Memoizes entire component, preventing re-renders if props haven't changed
export const Attribution = memo(function Attribution(): JSX.Element {
  // Log
  logger.logTraceRender('components/attribution/attribution');

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();

  // State
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);

  // Store
  const mapId = useStoreGeoViewMapId();
  const interaction = useStoreMapInteraction();
  const mapAttribution = useStoreMapAttribution();

  // Get container
  const mapElem = document.getElementById(`shell-${mapId}`);

  // Set style for type of interaction (dynamic vs static)
  const buttonStyles = {
    ...ICON_BUTTON_BASE_STYLES,
    color: interaction === 'dynamic' ? theme.palette.geoViewColor.bgColor.dark[650] : theme.palette.geoViewColor.grey.dark[500],
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

  // #endregion

  return (
    <ClickAwayListener mouseEvent="onMouseDown" touchEvent="onTouchStart" onClickAway={handleClickAway}>
      <Box>
        <IconButton
          id="attribution"
          onClick={handleOpenPopover}
          className={open ? 'active' : ''}
          aria-label={t('mapctrl.attribution.tooltip')}
          tooltipPlacement="top"
          sx={buttonStyles}
        >
          <CopyrightIcon />
        </IconButton>
        <Popper
          open={open}
          anchorEl={anchorEl}
          placement="top-end"
          container={mapElem}
          sx={{
            pointerEvents: 'auto',
            zIndex: theme.zIndex.modal + 100,
          }}
        >
          <Paper>
            <Box sx={BOX_STYLES}>{attributionContent}</Box>
          </Paper>
        </Popper>
      </Box>
    </ClickAwayListener>
  );
});
