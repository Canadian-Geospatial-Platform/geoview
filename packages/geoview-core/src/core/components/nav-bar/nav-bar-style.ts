import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';

/**
 * Get custom sx classes for the navigation bar
 *
 * @param {Theme} theme the theme object
 * @returns {Object} the sx classes object
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  navBarRef: {
    width: 'min-content !important',
    position: 'absolute',
    right: theme.spacing(7),
    padding: '6px',
    display: 'flex',
    flexDirection: 'column',
    marginRight: 0,
    zIndex: 150,
    pointerEvents: 'all',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    transition: 'bottom 300ms ease-in-out',
    bottom: '6rem',
    alignItems: 'flex-start',
    flexWrap: 'wrap-reverse',
    maxHeight: '60%',
    gap: '15px',
  },
  navBtnGroupContainer: {
    display: 'flex',
    position: 'relative',
    pointerEvents: 'auto',
    overflowY: 'hidden',
    padding: 5,
    flexDirection: 'column',
  },
  navBtnGroup: {
    borderRadius: theme.spacing(5),
    backgroundColor: theme.palette.geoViewColor.bgColor.light[500],

    '& .MuiButtonGroup-grouped:not(:last-child)': {
      borderColor: theme.palette.geoViewColor.bgColor.light[900],
    },
  },
  navButton: {
    backgroundColor: theme.palette.geoViewColor.bgColor.light[500],
    color: theme.palette.geoViewColor.bgColor.dark[900],
    borderRadius: theme.spacing(5),
    width: '44px',
    height: '44px',
    maxWidth: '44px',
    minWidth: '44px',
    padding: 'initial',
    transition: 'background-color 0.3s ease-in-out',
    '&:not(:last-of-type)': {
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      borderBottom: `1px solid ${theme.palette.geoViewColor.bgColor.light[900]}`,
    },
    '&:not(:first-of-type)': {
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
    },
    '&:hover': {
      backgroundColor: theme.palette.geoViewColor.bgColor.light[500],
      color: theme.palette.geoViewColor.bgColor.dark[700],
    },
    '&:focus': {
      backgroundColor: theme.palette.geoViewColor.bgColor.light[500],
      color: theme.palette.geoViewColor.bgColor.dark[700],
    },
    '&:active': {
      backgroundColor: theme.palette.geoViewColor.bgColor.light[500],
      color: theme.palette.geoViewColor.bgColor.dark[950],
    },
  },
  popoverTitle: {
    fontSize: theme.palette.geoViewFontSize.default,
    fontWeight: '700',
    color: theme.palette.geoViewColor.textColor.main,
    borderBottom: `1px solid ${theme.palette.geoViewColor.bgColor.dark[100]}}`,
  },
});
