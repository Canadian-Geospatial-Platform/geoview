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
    marginLeft: theme.spacing(1),
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
    padding: theme.spacing(0.5, 2),
    borderBottom: `1px solid ${theme.palette.geoViewColor?.bgColor.dark[100]}`,
    gap: theme.spacing(2),
  },
  versionsInfoTitle: {
    fontSize: theme.palette.geoViewFontSize?.default,
    fontWeight: '700',
    color: theme.palette.geoViewColor?.textColor.main,
  },
  versionCloseButton: {
    marginRight: theme.spacing(-1),
  },
  versionInfoContent: {
    padding: theme.spacing(2),
  },
  versionList: {
    listStyle: 'none',
    padding: theme.spacing(0),
    margin: theme.spacing(0),
    '& li': {
      margin: theme.spacing(0, 0, 0.75, 0),
    },
  },
  visuallyHidden,
});
