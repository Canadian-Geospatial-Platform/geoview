import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Box, Link, SvgIcon, ClickAwayListener, List, Paper, useTheme } from '@mui/material';

import { useUIController } from '@/core/controllers/use-controllers';
import { GITHUB_REPO, GEO_URL_TEXT, CONTAINER_TYPE } from '@/core/utils/constant';
import { GeoCaIcon, IconButton, Popper, CloseIcon } from '@/ui';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import { useStoreMapInteraction } from '@/core/stores/states/map-state';
import { GitHubIcon } from '@/ui/icons';
import { handleEscapeKey } from '@/core/utils/utilities';
import { FocusTrapContainer } from '@/core/components/common/focus-trap-container';
import { useStoreUIActiveTrapGeoView } from '@/core/stores/states/ui-state';
import { DateMgt } from '@/core/utils/date-mgt';
import { logger } from '@/core/utils/logger';
import type { SxStyles } from '@/ui/style/types';
import { getSxClasses } from './version-style';

// eslint-disable-next-line no-underscore-dangle
declare const __VERSION__: TypeAppVersion;

/** Version information for the application. */
export type TypeAppVersion = {
  hash: string;
  major: number;
  minor: number;
  patch: number;
  timestamp: string;
};

/**
 * Version button and popover panel displaying app version, build date, and links.
 *
 * Not memoized because it has no props and the component's internal state
 * (popover open/close) changes independently.
 *
 * @returns The version button and popover panel
 */
export default function Version(): JSX.Element {
  // Log
  logger.logTraceRender('core/components/app-bar/buttons/version');

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();

  /**
   * Builds custom sx classes for the version panel.
   */
  const memoSxClasses = useMemo((): SxStyles => {
    // Log
    logger.logTraceUseMemo('VERSION - memoSxClasses', theme);
    return getSxClasses(theme);
  }, [theme]);

  // Store
  const mapId = useStoreGeoViewMapId();
  const interaction = useStoreMapInteraction();
  const activeTrapGeoView = useStoreUIActiveTrapGeoView();
  const uiController = useUIController();

  // Get container
  const mapElem = document.getElementById(`shell-${mapId}`);

  // State
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);

  // #region Handlers

  /**
   * Handles when the version button is clicked to toggle the popover.
   */
  const handleOpenPopover = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>): void => {
      setAnchorEl(event.currentTarget);
      setOpen((prev) => !prev);

      // Register focus trap with button as the return target
      uiController.enableFocusTrap({
        activeElementId: `${mapId}-${CONTAINER_TYPE.APP_BAR}-version-ft`,
        callbackElementId: `${mapId}-${CONTAINER_TYPE.APP_BAR}-version-btn`,
      });
    },
    [mapId, uiController]
  );

  /**
   * Handles clicking away from the version popover to close it.
   */
  const handleClickAway = useCallback((): void => {
    if (open) {
      setOpen(false);
      // Restore focus to the button that opened the panel
      uiController.disableFocusTrap();
    }
  }, [open, uiController]);

  // #endregion

  return (
    <ClickAwayListener mouseEvent="onMouseDown" touchEvent="onTouchStart" onClickAway={handleClickAway}>
      <Box sx={{ padding: interaction === 'dynamic' ? 'none' : '5px' }}>
        <IconButton
          id={`${mapId}-${CONTAINER_TYPE.APP_BAR}-version-btn`}
          aria-haspopup="dialog"
          aria-label={t('appbar.version')}
          tooltipPlacement="right"
          onClick={handleOpenPopover}
          className={`${interaction === 'dynamic' ? 'buttonFilled' : 'style4'} ${open ? 'active' : ''}`}
        >
          <SvgIcon viewBox="-4 -2 38 36">
            <GeoCaIcon />
          </SvgIcon>
        </IconButton>

        <Popper
          role="dialog"
          id={`${mapId}-${CONTAINER_TYPE.APP_BAR}-version-dialog`}
          aria-labelledby={`${mapId}-${CONTAINER_TYPE.APP_BAR}-version-title`}
          aria-modal="true"
          open={open}
          anchorEl={anchorEl}
          placement="right-end"
          strategy="fixed"
          onClose={handleClickAway}
          container={mapElem}
          focusSelector="button"
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
          handleKeyDown={handleEscapeKey}
        >
          <FocusTrapContainer
            id={`${mapId}-${CONTAINER_TYPE.APP_BAR}-version-ft`}
            open={open && activeTrapGeoView}
            containerType={CONTAINER_TYPE.APP_BAR}
          >
            <Paper component="section" sx={memoSxClasses.versionInfoPanel}>
              <Box component="header" sx={memoSxClasses.versionHeading}>
                <Typography sx={memoSxClasses.versionsInfoTitle} component="h2" id={`${mapId}-${CONTAINER_TYPE.APP_BAR}-version-title`}>
                  {t('appbar.version')}
                </Typography>
                <IconButton
                  sx={memoSxClasses.versionCloseButton}
                  className="buttonPopperClose"
                  onClick={handleClickAway}
                  size="small"
                  aria-label={t('general.close')}
                  tooltipPlacement="right"
                >
                  <CloseIcon />
                </IconButton>
              </Box>
              <Box sx={memoSxClasses.versionInfoContent}>
                <List sx={memoSxClasses.versionList}>
                  <Box component="li" sx={{ display: 'flex', flexDirection: 'row', alignContent: 'center', gap: '6px' }}>
                    <SvgIcon viewBox="-4 -2 38 36">
                      <GeoCaIcon />
                    </SvgIcon>
                    <Link rel="noopener" href={GEO_URL_TEXT.url} target="_blank">
                      {GEO_URL_TEXT.text}
                    </Link>
                  </Box>
                  <Box component="li" sx={{ display: 'flex', flexDirection: 'row', alignContent: 'center', gap: '6px' }}>
                    <GitHubIcon />
                    <Link rel="noopener" href={GITHUB_REPO} target="_blank">
                      {t('appbar.repoLink')}
                    </Link>
                  </Box>
                  <Typography component="li">{`v.${__VERSION__.major}.${__VERSION__.minor}.${__VERSION__.patch}`}</Typography>
                  <Typography component="li">
                    <time dateTime={DateMgt.formatDate(__VERSION__.timestamp, 'YYYY-MM-DD')}>
                      {DateMgt.formatDate(__VERSION__.timestamp, 'YYYY-MM-DD')}
                    </time>
                  </Typography>
                </List>
              </Box>
            </Paper>
          </FocusTrapContainer>
        </Popper>
      </Box>
    </ClickAwayListener>
  );
}
