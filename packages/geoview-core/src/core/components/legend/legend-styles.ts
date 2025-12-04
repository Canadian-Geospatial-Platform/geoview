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
  legendLayerListItem: {
    padding: '6px 4px',
    '& .layerTitle': {
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
    },

    '& .layerTitle > .MuiListItemText-secondary': {
      color: theme.palette.geoViewColor.textColor.light[400],
    },

    '& .MuiListItemText-root': {
      marginLeft: '12px',
    },

    '& .MuiCollapse-vertical': {
      marginLeft: '6px',

      '& ul': {
        marginTop: 0,
        padding: 0,
      },
      '& li': {
        paddingLeft: '6px',
        marginBottom: '3px',
        fontWeight: '400',

        '&.unchecked': {
          borderLeft: `5px solid ${theme.palette.geoViewColor.bgColor.dark[200]}`,
          fontStyle: 'italic',
          color: theme.palette.geoViewColor.textColor.light[600],
        },

        '&.checked': {
          borderLeft: `5px solid ${theme.palette.geoViewColor.bgColor.dark[600]}`,
        },
      },
    },
    '& .outOfRange': {
      '& .layerTitle': {
        color: `${theme.palette.grey[700]}`,
        fontStyle: 'italic',
      },
    },
    '& .outOfRangeButton': {
      display: 'none',
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
  subList: {
    width: '100%',
    '& .MuiListItemIcon-root': {
      minWidth: '1rem',
    },
    '& img': {
      maxWidth: '1.5rem',
    },
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
  toggleableItem: {
    cursor: 'pointer',
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
