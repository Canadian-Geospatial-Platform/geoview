import { Theme } from '@mui/material/styles';
import { CONTAINER_TYPE } from '@/core/utils/constant';

type SxClasses = Record<string, object>;

/**
 * Calculates and returns the container height based on various parameters
 *
 * @param {string} containerType - The type of container to calculate height for
 * @param {boolean} isFullScreen - Indicates if the container is in fullscreen mode
 * @param {boolean} footerBarIsCollapsed - Indicates if the footer bar is in collapsed state
 * @param {number} footerPanelResizeValue - The resize value for the footer panel
 * @returns {string} The calculated height value as a CSS-compatible string
 */
const getContainerHeight = (
  containerType: string,
  isFullScreen: boolean,
  footerBarIsCollapsed: boolean,
  footerPanelResizeValue: number
): string => {
  // Default height
  const defaultHeight = 'calc(100vh - 40px)';

  // Handle APP_BAR case
  if (containerType === CONTAINER_TYPE.APP_BAR) {
    if (isFullScreen && !footerBarIsCollapsed) {
      return `calc(${100 - footerPanelResizeValue}vh - 40px)`;
    }
    return defaultHeight;
  }

  // Handle FOOTER_BAR case
  if (containerType === CONTAINER_TYPE.FOOTER_BAR && isFullScreen) {
    return `calc(${footerPanelResizeValue}vh - 40px)`;
  }

  // Default case
  return defaultHeight;
};

/**
 * Generates the main SX classes for styling components
 * @param {boolean} isFullScreen - Indicates if the component is in fullscreen mode
 * @param {number} footerPanelResizeValue - The resize value for the footer panel in viewport height units
 * @param {boolean} footerBarIsCollapsed - Indicates if the footer bar is collapsed
 * @param {string} containerType - The type of container ('app-bar' or 'footer-bar')
 * @returns {SxClasses} An object containing the style classes
 */
export const getSxClassesMain = (
  isFullScreen: boolean,
  footerPanelResizeValue: number,
  footerBarIsCollapsed: boolean,
  containerType: string
): SxClasses => ({
  container: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
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
    },

    '& .layerTitle > .MuiListItemText-secondary': {
      color: theme.palette.geoViewColor.textColor.light[400],
    },
    '& .layerTitle > div': {
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
});
