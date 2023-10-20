import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Box, Link, Theme, SvgIcon } from '@mui/material';

import { GITHUB_REPO, GEO_URL_TEXT } from '@/core/utils/constant';
import { GeoCaIcon, Popover, IconButton } from '@/ui';

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

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;

  const sxClasses = {
    width: '200px',
    p: 7,
    m: 7,
    '& a': {
      color: (theme: Theme) => (theme.palette.mode === 'light' ? theme.palette.secondary.contrastText : theme.palette.primary.light),
      textDecoration: 'underLine',
    },
  };

  return (
    <>
      <IconButton
        aria-describedby={id}
        id="version-button"
        tooltip="appbar.version"
        tooltipPlacement="bottom-end"
        onClick={handleClick}
        className={open ? 'active' : ''}
      >
        <SvgIcon viewBox="-4 -2 38 36">
          <GeoCaIcon />
        </SvgIcon>
      </IconButton>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Box sx={sxClasses}>
          <Typography component="div">
            <Typography component="div">{t('appbar.version')}</Typography>
            <hr />
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
          </Typography>
        </Box>
      </Popover>
    </>
  );
}
