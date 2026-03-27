import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Theme } from '@mui/material';
import { Typography, Box, Link, SvgIcon, ClickAwayListener, List, Paper, useTheme } from '@mui/material';

import { GITHUB_REPO, GEO_URL_TEXT, CONTAINER_TYPE } from '@/core/utils/constant';
import { GeoCaIcon, IconButton, Popper, CloseIcon } from '@/ui';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { useMapInteraction } from '@/core/stores/store-interface-and-intial-values/map-state';
import { GitHubIcon } from '@/ui/icons';
import { handleEscapeKey } from '@/core/utils/utilities';
import { FocusTrapContainer } from '@/core/components/common/focus-trap-container';
import { useUIActiveTrapGeoView, useUIStoreActions } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { DateMgt } from '@/core/utils/date-mgt';
import type { SxStyles } from '@/ui/style/types';
import { visuallyHidden } from '@/ui/style/default';

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
 * Gets custom sx classes for the version panel.
 *
 * @param theme - The MUI theme object
 * @returns The sx classes for version panel styling
 */
const getSxClasses = (theme: Theme): SxStyles => ({
  versionInfoPanel: {
    width: '200px',
    backgroundColor: theme.palette.geoViewColor.bgColor.light[200],
    borderRadius: '5px',
    boxShadow: 2,
    marginLeft: '15px',
    '& a': {
      color: theme.palette.mode === 'light' ? theme.palette.secondary.contrastText : theme.palette.geoViewColor.primary.light[300],
      textDecoration: 'underLine',
    },
  },
  versionHeading: {
    display: 'flex',
    alignItems: 'center',
    borderBottom: `1px solid ${theme.palette.geoViewColor.bgColor.dark[100]}`,
    padding: '10px',
    justifyContent: 'space-between',
  },
  versionsInfoTitle: {
    fontSize: theme.palette.geoViewFontSize.default,
    fontWeight: '700',
    color: theme.palette.geoViewColor.textColor.main,
  },
  versionInfoContent: {
    padding: '10px',
    gap: '5px',
    display: 'flex',
    flexDirection: 'column',
  },
  versionList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    '& li': {
      margin: '0 0 5px 0',
    },
  },
  visuallyHidden,
});

/**
 * Version button and popover panel displaying app version, build date, and links.
 *
 * @returns The version button and popover panel
 */
export default function Version(): JSX.Element {
  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // Store
  const interaction = useMapInteraction();
  const activeTrapGeoView = useUIActiveTrapGeoView();
  const { enableFocusTrap, disableFocusTrap } = useUIStoreActions();

  // Get container
  const mapId = useGeoViewMapId();
  const mapElem = document.getElementById(`shell-${mapId}`);

  // State
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);

  // #region Handlers

  /**
   * Handles when the version button is clicked to toggle the popover.
   */
  const handleOpenPopover = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      setAnchorEl(event.currentTarget);
      setOpen((prev) => !prev);

      // Register focus trap with button as the return target
      enableFocusTrap({
        activeElementId: `${mapId}-${CONTAINER_TYPE.APP_BAR}-version-ft`,
        callbackElementId: `${mapId}-${CONTAINER_TYPE.APP_BAR}-version-btn`,
      });
    },
    [mapId, enableFocusTrap]
  );

  /**
   * Handles clicking away from the version popover to close it.
   */
  const handleClickAway = useCallback((): void => {
    if (open) {
      setOpen(false);
      // Restore focus to the button that opened the panel
      disableFocusTrap();
    }
  }, [open, disableFocusTrap]);

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
          onClose={handleClickAway}
          container={mapElem}
          focusSelector="button"
          modifiers={[
            {
              name: 'eventListeners',
              options: { scroll: false, resize: true },
            },
          ]}
          sx={{
            position: 'fixed',
            pointerEvents: 'auto',
            zIndex: theme.zIndex.modal + 100,
          }}
          handleKeyDown={(key, callBackFn) => handleEscapeKey(key, '', false, callBackFn)}
        >
          <FocusTrapContainer
            id={`${mapId}-${CONTAINER_TYPE.APP_BAR}-version-ft`}
            open={open && activeTrapGeoView}
            containerType={CONTAINER_TYPE.APP_BAR}
          >
            <Paper component="section" sx={sxClasses.versionInfoPanel}>
              <Box component="header" sx={sxClasses.versionHeading}>
                <Typography sx={sxClasses.versionsInfoTitle} component="h2" id={`${mapId}-${CONTAINER_TYPE.APP_BAR}-version-title`}>
                  {t('appbar.version')}
                </Typography>
                <IconButton onClick={handleClickAway} size="small" aria-label={t('general.close')} tooltipPlacement="right">
                  <CloseIcon />
                </IconButton>
              </Box>
              <Box sx={sxClasses.versionInfoContent}>
                <List sx={sxClasses.versionList}>
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
