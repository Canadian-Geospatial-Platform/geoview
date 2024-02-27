import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Box, Link, Theme, SvgIcon, ClickAwayListener, Paper } from '@mui/material';

import { GITHUB_REPO, GEO_URL_TEXT } from '@/core/utils/constant';
import { GeoCaIcon, IconButton, Popper } from '@/ui';
import { useGeoViewMapId } from '@/app';

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
  const mapElem = document.getElementById(`shell-${mapId}`);

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    setOpen(!open);
  };

  const handleClickAway = () => {
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
      zIndex: 300,
      padding: '10px',
      '& a': {
        color: (theme: Theme) =>
          theme.palette.mode === 'light' ? theme.palette.secondary.contrastText : theme.palette.geoViewColor.primary.light[300],
        textDecoration: 'underLine',
      },
    },
    versionsInfoTitle: {
      fontSize: '15px',
      fontWeight: '700',
      padding: '10px',
      color: (theme: Theme) => theme.palette.geoViewColor.textColor.main,
      borderBottom: (theme: Theme) => `1px solid ${theme.palette.geoViewColor.bgColor.dark[300]}}`,
      marginBottom: '10px',
    },
  };

  return (
    <ClickAwayListener mouseEvent="onMouseDown" touchEvent="onTouchStart" onClickAway={handleClickAway}>
      <div>
        <IconButton
          id="version-button"
          tooltip="appbar.version"
          tooltipPlacement="bottom-end"
          onClick={handleClick}
          className={`style3 ${open ? 'active' : ''}`}
        >
          <SvgIcon viewBox="-4 -2 38 36">
            <GeoCaIcon />
          </SvgIcon>
        </IconButton>

        <Popper sx={{ zIndex: '150' }} open={open} anchorEl={anchorEl} placement="right-end" container={mapElem}>
          <Paper sx={sxClasses.versionInfoPanel}>
            <Typography sx={sxClasses.versionsInfoTitle} component="h3">
              {t('appbar.version')}
            </Typography>
            <Box sx={{ padding: '10px' }}>
              <Typography component="div">
                <Link rel="noopener" href={GEO_URL_TEXT.url} target="_black">
                  {GEO_URL_TEXT.text}
                </Link>
              </Typography>
              <Typography component="div">
                <Link rel="noopener" href={GITHUB_REPO} target="_black">
                  {t('appbar.repoLink')}
                </Link>
              </Typography>
              <Typography component="div">{`v.${__VERSION__.major}.${__VERSION__.minor}.${__VERSION__.patch}`}</Typography>
              <Typography component="div">{new Date(__VERSION__.timestamp).toLocaleDateString()}</Typography>
            </Box>
          </Paper>
        </Popper>
      </div>
    </ClickAwayListener>
  );
}
