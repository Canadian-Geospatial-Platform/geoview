import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Box, Link, Theme, SvgIcon, ClickAwayListener, Paper } from '@mui/material';

import { GITHUB_REPO, GEO_URL_TEXT } from '@/core/utils/constant';
import { GeoCaIcon, IconButton, Popper, CloseIcon } from '@/ui';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { useMapInteraction } from '@/core/stores/store-interface-and-intial-values/map-state';
import { GitHubIcon } from '@/ui/icons';
import { handleEscapeKey } from '@/core/utils/utilities';
import { FocusTrapContainer } from '../../common';
import { useUIActiveTrapGeoView } from '@/core/stores/store-interface-and-intial-values/ui-state';

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

export default function Version(): JSX.Element {
  const { t } = useTranslation<string>();

  const mapId = useGeoViewMapId();
  const interaction = useMapInteraction();
  const activeTrapGeoView = useUIActiveTrapGeoView();

  const mapElem = document.getElementById(`shell-${mapId}`);

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
    setAnchorEl(event.currentTarget);
    setOpen(!open);
  };

  const handleClickAway = (): void => {
    if (open) {
      setOpen(false);
      setAnchorEl(null);
    }
  };

  const sxClasses = {
    versionInfoPanel: {
      width: '200px',
      backgroundColor: (theme: Theme) => theme.palette.geoViewColor.bgColor.light[200],
      borderRadius: '5px',
      boxShadow: 2,
      marginLeft: '15px',
      '& a': {
        color: (theme: Theme) =>
          theme.palette.mode === 'light' ? theme.palette.secondary.contrastText : theme.palette.geoViewColor.primary.light[300],
        textDecoration: 'underLine',
      },
    },
    versionHeading: {
      display: 'flex',
      alignItems: 'center',
      borderBottom: (theme: Theme) => `1px solid ${theme.palette.geoViewColor.bgColor.dark[100]}}`,
    },
    versionsInfoTitle: {
      fontSize: (theme: Theme) => theme.palette.geoViewFontSize.default,
      fontWeight: '700',
      padding: '20px',
      color: (theme: Theme) => theme.palette.geoViewColor.textColor.main,
      marginBottom: '10px',
    },
    versionInfoContent: {
      padding: '20px',
      gap: '5px',
      display: 'flex',
      flexDirection: 'column',
    },
  };

  return (
    <ClickAwayListener mouseEvent="onMouseDown" touchEvent="onTouchStart" onClickAway={handleClickAway}>
      <Box>
        <IconButton
          id="version-button"
          tooltip="appbar.version"
          tooltipPlacement="bottom-end"
          onClick={handleClick}
          className={`${interaction === 'dynamic' ? 'buttonFilled' : 'style4'} ${open ? 'active' : ''}`}
          aria-label="appbar.version"
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
          handleKeyDown={(key, callBackFn) => handleEscapeKey(key, '', false, callBackFn)}
          disablePortal
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
                <Typography component="div">{new Date(__VERSION__.timestamp).toLocaleDateString()}</Typography>
              </Box>
            </Paper>
          </FocusTrapContainer>
        </Popper>
      </Box>
    </ClickAwayListener>
  );
}
