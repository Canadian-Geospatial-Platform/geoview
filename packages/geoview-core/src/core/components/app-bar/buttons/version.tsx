import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { SvgIcon, ClickAwayListener, useTheme } from '@mui/material';

import { GITHUB_REPO, GEO_URL_TEXT, CONTAINER_TYPE } from '@/core/utils/constant';
import { GeoCaIcon } from '@/ui/svg/svg-icon';
import { CloseIcon, GitHubIcon } from '@/ui/icons';
import { IconButton } from '@/ui/icon-button/icon-button';
import { Popper } from '@/ui/popper/popper';
import { Typography } from '@/ui/typography/typography';
import { Box, Link } from '@/ui/layout';
import { List } from '@/ui/list/list';
import { Paper } from '@/ui/paper/paper';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import { FocusTrapContainer } from '@/core/components/common/focus-trap-container';
import { useMapPopover } from '@/core/components/common/hooks/use-map-popover';
import { usePopoverFocusOwner } from '@/core/components/common/hooks/use-popover-focus-owner';
import { useShellContainer } from '@/core/containers/shell-container-context';
import { useStoreUIActiveFocusItem, useStoreUIActiveTrapGeoView } from '@/core/stores/states/ui-state';
import { useStoreMapInteraction } from '@/core/stores/states/map-state';
import { DateMgt } from '@/core/utils/date-mgt';
import { DomHelper } from '@/core/utils/dom-helper';
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
  /** Optional build suffix (e.g. 'dev.a1b2c3d') appended for development builds; empty for release builds. */
  suffix?: string;
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
  const focusItem = useStoreUIActiveFocusItem();

  // Get container
  const shellContainer = useShellContainer();

  // State
  const { open, anchorEl, tryOpenAt, close } = useMapPopover();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const focusTrapId = DomHelper.buildAppBarVersionFocusTrapId(mapId);
  const buttonId = DomHelper.buildAppBarVersionButtonId(mapId);
  const { claimFocusOwner, releaseFocusOwner, synchronizeOwnership } = usePopoverFocusOwner(focusTrapId, buttonId, close);

  // #region Handlers

  /**
   * Restores the previous inner focus owner without scheduling another focus jump.
   *
   * @param restoreTrigger - Whether this was an explicit keyboard dismissal
   */
  const closePanel = useCallback(
    (restoreTrigger: boolean): void => {
      releaseFocusOwner();
      close();
      if (restoreTrigger) buttonRef.current?.focus();
    },
    [close, releaseFocusOwner]
  );

  /**
   * Handles when the version button is clicked to toggle the popover.
   */
  const handleOpenPopover = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>): void => {
      if (open) {
        closePanel(true);
        return;
      }
      const result = tryOpenAt(event.currentTarget);
      if (result.ok && activeTrapGeoView) {
        claimFocusOwner(result.previousFocusItem);
      }
    },
    [activeTrapGeoView, claimFocusOwner, closePanel, open, tryOpenAt]
  );

  /**
   * Handles clicking away from the version popover to close it.
   */
  const handleClickAway = useCallback((): void => {
    if (open) closePanel(false);
  }, [closePanel, open]);

  /**
   * Handles Escape as an explicit keyboard dismissal.
   */
  const handleKeyDown = useCallback(
    (key: string): void => {
      if (key === 'Escape') closePanel(true);
    },
    [closePanel]
  );

  /**
   * Closes the About panel and returns focus to its button.
   */
  const handleClose = useCallback((): void => {
    closePanel(true);
  }, [closePanel]);

  // #endregion

  /**
   * Coordinates this popover with the one active inner focus owner.
   */
  useEffect(() => {
    logger.logTraceUseEffect('VERSION - focus owner', open, activeTrapGeoView, focusItem.activeElementId);
    synchronizeOwnership(open, activeTrapGeoView);
  }, [activeTrapGeoView, focusItem.activeElementId, open, synchronizeOwnership]);

  return (
    <ClickAwayListener mouseEvent="onMouseDown" touchEvent="onTouchStart" onClickAway={handleClickAway}>
      <Box sx={interaction === 'dynamic' ? memoSxClasses.versionButtonBoxDynamic : memoSxClasses.versionButtonBoxStatic}>
        <IconButton
          id={DomHelper.buildAppBarVersionButtonId(mapId)}
          iconRef={buttonRef}
          aria-haspopup="dialog"
          aria-label={t('appbar.version')}
          tooltipPlacement="right"
          onClick={handleOpenPopover}
          className={`${interaction === 'dynamic' ? 'buttonFilled' : 'appBarButtonStatic'} ${open ? 'active' : ''}`}
        >
          <SvgIcon viewBox="-4 -2 38 36">
            <GeoCaIcon />
          </SvgIcon>
        </IconButton>

        <Popper
          role="dialog"
          id={`${mapId}-${CONTAINER_TYPE.APP_BAR}-version-dialog`}
          aria-labelledby={`${mapId}-${CONTAINER_TYPE.APP_BAR}-version-title`}
          open={open}
          anchorEl={anchorEl}
          placement="right-end"
          strategy="fixed"
          onClose={handleClickAway}
          container={shellContainer}
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
          handleKeyDown={handleKeyDown}
        >
          <FocusTrapContainer
            focusTrapContainerId={DomHelper.buildAppBarVersionFocusTrapId(mapId)}
            open={open && activeTrapGeoView}
            containerType={CONTAINER_TYPE.APP_BAR}
          >
            <Paper component="section" sx={memoSxClasses.versionInfoPanel}>
              <Box component="header" sx={memoSxClasses.versionHeading}>
                <Typography
                  variant="h6"
                  sx={memoSxClasses.versionsInfoTitle}
                  component="h2"
                  id={`${mapId}-${CONTAINER_TYPE.APP_BAR}-version-title`}
                >
                  {t('appbar.version')}
                </Typography>
                <IconButton
                  sx={memoSxClasses.versionCloseButton}
                  className="buttonPopperClose"
                  onClick={handleClose}
                  size="small"
                  aria-label={t('general.close')}
                  tooltipPlacement="right"
                >
                  <CloseIcon />
                </IconButton>
              </Box>
              <Box sx={memoSxClasses.versionInfoContent}>
                <List sx={memoSxClasses.versionList}>
                  <Box component="li" sx={memoSxClasses.versionListItem}>
                    <SvgIcon viewBox="-4 -2 38 36">
                      <GeoCaIcon />
                    </SvgIcon>
                    <Link rel="noopener" href={GEO_URL_TEXT.url} target="_blank">
                      {GEO_URL_TEXT.text}
                    </Link>
                  </Box>
                  <Box component="li" sx={memoSxClasses.versionListItem}>
                    <GitHubIcon />
                    <Link rel="noopener" href={GITHUB_REPO} target="_blank">
                      {t('appbar.repoLink')}
                    </Link>
                  </Box>
                  <Typography component="li">{`v.${__VERSION__.major}.${__VERSION__.minor}.${__VERSION__.patch}${
                    __VERSION__.suffix ? `-${__VERSION__.suffix}` : ''
                  }`}</Typography>
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
