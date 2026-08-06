import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';
import { visuallyHidden } from '@/ui/style/default';

/**
 * Gets custom sx classes for the version panel.
 *
 * @param theme - The theme object
 * @returns The sx classes object
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  popper: {
    pointerEvents: 'auto',
    zIndex: theme.zIndex.modal + 100,
  },
  versionInfoPanel: {
    width: 'auto',
    minWidth: '180px',
    maxWidth: '70vw',
    backgroundColor: theme.palette.geoViewColor?.bgColor.light[200],
    borderRadius: '5px',
    boxShadow: 2,
    marginLeft: theme.spacing(6),
    '& a': {
      color: theme.palette.mode === 'light' ? theme.palette.secondary.contrastText : theme.palette.geoViewColor?.primary.light[300],
      textDecoration: 'underline',
    },
  },
  versionHeading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: '48px',
    minWidth: 0,
    padding: '4px 16px',
    borderBottom: `1px solid ${theme.palette.geoViewColor?.bgColor.dark[100]}`,
    gap: '16px',
  },
  versionsInfoTitle: {
    fontSize: theme.palette.geoViewFontSize?.default,
    fontWeight: '700',
    color: theme.palette.geoViewColor?.textColor.main,
  },
  versionCloseButton: {
    marginRight: '-8px',
  },
  versionInfoContent: {
    padding: '16px',
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
