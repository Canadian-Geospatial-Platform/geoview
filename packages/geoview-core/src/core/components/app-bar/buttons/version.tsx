import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Box, Link, Theme, SvgIcon, ClickAwayListener, Paper, useTheme } from '@mui/material';

import { GITHUB_REPO, GEO_URL_TEXT } from '@/core/utils/constant';
import { GeoCaIcon, IconButton, Popper, CloseIcon } from '@/ui';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { useMapInteraction } from '@/core/stores/store-interface-and-intial-values/map-state';
import { GitHubIcon } from '@/ui/icons';
import { handleEscapeKey } from '@/core/utils/utilities';
import { FocusTrapContainer } from '@/core/components/common/focus-trap-container';
import { useUIActiveTrapGeoView } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { DateMgt } from '@/core/utils/date-mgt';
import { logger } from '@/core/utils/logger';
import { SxStyles } from '@/ui/style/types';

// eslint-disable-next-line no-underscore-dangle
declare const __VERSION__: TypeAppVersion;

/**
 * An object containing version information.
 *
 * @export
 * @interface TypeAppVersion
 */
export type TypeAppVersion = {
  hash: string;
  major: number;
  minor: number;
  patch: number;
  timestamp: string;
};

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
    borderBottom: `1px solid ${theme.palette.geoViewColor.bgColor.dark[100]}}`,
  },
  versionsInfoTitle: {
    fontSize: theme.palette.geoViewFontSize.default,
    fontWeight: '700',
    padding: '20px',
    color: theme.palette.geoViewColor.textColor.main,
    marginBottom: '10px',
  },
  versionInfoContent: {
    padding: '20px',
    gap: '5px',
    display: 'flex',
    flexDirection: 'column',
  },
});

export default function Version(): JSX.Element {
  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // Store
  const interaction = useMapInteraction();
  const activeTrapGeoView = useUIActiveTrapGeoView();

  // Get container
  const mapId = useGeoViewMapId();
  const mapElem = document.getElementById(`shell-${mapId}`);

  // State
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);

  // Handlers
  const handleOpenPopover = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    logger.logTraceUseCallback('VERSION - open');
    setAnchorEl(event.currentTarget);
    setOpen((prev) => !prev);
  }, []);

  const handleClickAway = useCallback(() => {
    logger.logTraceUseCallback('VERSION - close');
    if (open) setOpen(false);
  }, [open]);



  return (
    <ClickAwayListener mouseEvent="onMouseDown" touchEvent="onTouchStart" onClickAway={handleClickAway}>
      <Box sx={{ padding: interaction === 'dynamic' ? 'none' : '5px' }}>
        <IconButton
          id="version-button"
          tooltip={t('appbar.version')!}
          aria-label={t('appbar.version')!}
          tooltipPlacement="right"
          onClick={handleOpenPopover}
          className={`${interaction === 'dynamic' ? 'buttonFilled' : 'style4'} ${open ? 'active' : ''}`}
        >
          <SvgIcon viewBox="-4 -2 38 36">
            <GeoCaIcon />
          </SvgIcon>
        </IconButton>

        <Popper
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
          <FocusTrapContainer id={`${mapId}-version`} open={open && activeTrapGeoView}>
            <Paper sx={sxClasses.versionInfoPanel}>
              <Box sx={sxClasses.versionHeading}>
                <Typography sx={sxClasses.versionsInfoTitle} component="h3">
                  {t('appbar.version')}
                </Typography>
                <IconButton onClick={handleClickAway}>
                  <CloseIcon />
                </IconButton>
              </Box>
              <Box sx={sxClasses.versionInfoContent}>
                <Box sx={{ display: 'flex', flexDirection: 'row', alignContent: 'center', gap: '6px' }}>
                  <SvgIcon viewBox="-4 -2 38 36">
                    <GeoCaIcon />
                  </SvgIcon>
                  <Link rel="noopener" href={GEO_URL_TEXT.url} target="_black">
                    {GEO_URL_TEXT.text}
                  </Link>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'row', alignContent: 'center', gap: '6px' }}>
                  <GitHubIcon />
                  <Link rel="noopener" href={GITHUB_REPO} target="_black">
                    {t('appbar.repoLink')}
                  </Link>
                </Box>
                <Typography component="div">{`v.${__VERSION__.major}.${__VERSION__.minor}.${__VERSION__.patch}`}</Typography>
                <Typography component="div">{DateMgt.formatDate(__VERSION__.timestamp, 'YYYY-MM-DD')}</Typography>
              </Box>
            </Paper>
          </FocusTrapContainer>
        </Popper>
      </Box>
    </ClickAwayListener>
  );
}
