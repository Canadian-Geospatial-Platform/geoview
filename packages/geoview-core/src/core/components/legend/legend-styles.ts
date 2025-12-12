import type { Theme } from '@mui/material/styles';

type SxClasses = Record<string, object>;

/**
 * Generates the main SX classes for styling components
 * @returns {SxClasses} An object containing the style classes
 */
export const getSxClassesMain = (): SxClasses => ({
  container: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100% - 47px)', // 47px is the height of the div containing the show/hide toggles
    overflowY: 'auto',
    overflowX: 'hidden',
  },
});

/**
 * Get custom sx classes for the legend
 *
 * @param {Theme} theme the theme object
 * @returns {Object} the sx classes object
 */
export const getSxClasses = (theme: Theme): SxClasses => ({
  title: {
    textAlign: 'left',
    fontWeight: '600',
    color: theme.palette.geoViewColor.textColor.main,
    fontSize: theme.palette.geoViewFontSize.md,
  },
  subtitle: {
    fontWeight: 'normal',
    fontSize: theme.palette.geoViewFontSize.md,
    textAlign: 'left',
  },
  layersListContainer: {
    padding: '20px',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden',

    [theme.breakpoints.down('sm')]: {
      width: '100%',
    },
    [theme.breakpoints.up('md')]: {
      width: '50%',
    },
    [theme.breakpoints.up('lg')]: {
      width: '33.33%',
    },
  },
  legendList: {
    paddingRight: '0.65rem',
  },
  legendListItem: {
    padding: '6px 4px',
    flexDirection: 'column',
    alignItems: 'flex-start',
    '& .MuiCollapse-vertical': {
      marginLeft: '6px',
    },
    '& .outOfRange': {
      '& .legendTitle': {
        color: `${theme.palette.grey[700]}`,
        fontStyle: 'italic',
      },
    },
    '& .outOfRangeButton': {
      display: 'none',
    },
  },
  legendListItemHeader: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    borderBottom: `1px solid ${theme.palette.geoViewColor.bgColor.dark[100]}`,
  },
  legendTitle: {
    marginLeft: '12px',
    fontSize: theme.palette.geoViewFontSize.md,
    fontWeight: '600',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    '>p': {
      margin: 0,
      color: theme.palette.geoViewColor.textColor.light[400],
      fontSize: theme.palette.geoViewFontSize.sm,
      lineHeight: 1.43,
    },
    '>div': {
      whiteSpace: 'normal',
      display: '-webkit-box',
      WebkitLineClamp: '3',
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
    },
    '& .MuiListItemText-secondary': {
      color: theme.palette.geoViewColor.textColor.light[400],
    },
  },
  layerList: {
    marginTop: 0,
    padding: 0,
    width: '100%',
    '& .MuiListItemIcon-root': {
      minWidth: '1rem',
    },
    '& img': {
      maxWidth: '1.5rem',
    },
  },
  layerListItem: {
    paddingLeft: '6px',
    marginBottom: '3px',
    fontWeight: '400',
    '& .MuiListItemText-root': {
      marginLeft: '12px',
    },
  },
  layerListItemButton: {
    padding: '0 0 0 6px',
    '&:hover': {
      backgroundColor: 'transparent',
    },
    '&.unchecked': {
      fontStyle: 'italic',
      color: theme.palette.geoViewColor.textColor.light[600],
      borderLeft: `5px solid ${theme.palette.geoViewColor.bgColor.dark[200]}`,
    },
    '&.unchecked:focus, &.unchecked.keyboard-focused': {
      borderLeft: `5px solid ${theme.palette.geoViewColor.bgColor.dark[200]} !important`,
    },
    '&.unchecked.Mui-focusVisible': {
      borderLeft: `5px solid ${theme.palette.geoViewColor.bgColor.dark[200]} !important`,
    },
    '&.checked': {
      borderLeft: `5px solid ${theme.palette.geoViewColor.bgColor.dark[600]}`,
    },
    '&.checked:focus, &.checked.keyboard-focused': {
      borderLeft: `5px solid ${theme.palette.geoViewColor.bgColor.dark[600]} !important`,
    },
    '&.checked.Mui-focusVisible': {
      borderLeft: `5px solid ${theme.palette.geoViewColor.bgColor.dark[600]} !important`,
    },
  },

  collapsibleContainer: {
    width: '100%',
    padding: '10px 0',
    margin: '0px 10px',
  },
  legendInstructionsTitle: {
    fontSize: theme.palette.geoViewFontSize.lg,
    fontWeight: '600',
    lineHeight: '1.5em',
  },
  legendInstructionsBody: {
    fontSize: theme.palette.geoViewFontSize.default,
  },
  layerStackIcons: {
    flexWrap: 'wrap',
    '& button': {
      padding: '0.25rem',
      marginRight: 0,
      '& svg': {
        width: '1.25rem',
        height: '1.25rem',
      },
    },
  },
  toggleBar: {
    borderBottom: `1px solid ${theme.palette.geoViewColor.bgColor.dark[100]}`,
    paddingTop: '8px',
    paddingLeft: '8px',
  },
  buttonDivider: {
    display: 'flex',
    alignItems: 'center',
    marginRight: 2,
    paddingRight: 2,
    position: 'relative',
    '&::after': {
      content: '""',
      position: 'absolute',
      right: 0,
      top: '15%',
      bottom: '15%',
      width: '1px',
      backgroundColor: theme.palette.geoViewColor.bgColor.dark[300],
    },
  },
});
