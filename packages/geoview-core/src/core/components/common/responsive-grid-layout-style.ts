import { Theme } from '@mui/material/styles';
import { SxStyles } from '@/ui/style/types';

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
  const defaultHeight = '100%';

  // Handle APP_BAR case
  if (containerType === CONTAINER_TYPE.APP_BAR) {
    if (isFullScreen && !footerBarIsCollapsed) {
      return `calc(${100 - footerPanelResizeValue}vh - 140px)`;
    }
    return 'calc(100vh - 40px)';
  }

  // Handle FOOTER_BAR case
  if (containerType === CONTAINER_TYPE.FOOTER_BAR && isFullScreen) {
    return `calc(${footerPanelResizeValue}vh - 40px)`;
  }

  // Default case
  return defaultHeight;
};

/**
 * Calculates and returns the maximum height based on various parameters
 *
 * @param {boolean} isFullScreen - Indicates if the component is in fullscreen mode
 * @param {string} containerType - The type of container to calculate height for
 * @param {number} mapHeight - The height of the map
 * @returns {string} The calculated maximum height value as a CSS-compatible string
 */
const getMaxHeight = (isFullScreen: boolean, containerType: string, mapHeight: number): string => {
  // If not fullscreen
  if (!isFullScreen) {
    if (containerType === CONTAINER_TYPE.FOOTER_BAR) {
      return `${mapHeight}px`;
    }
    return '660px';
  }

  // If fullscreen
  if (containerType === CONTAINER_TYPE.APP_BAR) {
    return `${mapHeight}px`;
  }
  return '100%';
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
  mapHeight: number,
  footerBarIsCollapsed: boolean,
  containerType: string
): SxClasses => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: containerType === CONTAINER_TYPE.FOOTER_BAR ? '20px' : '0px 10px 10px 10px',
  },
});

/**
 * Calculates and returns the maximum height based on various parameters
 *
 * @param {string} containerType - The type of container to calculate height for
 * @param {boolean} isMapFullScreen - Indicates if the map is in fullscreen mode
 * @param {number} footerPanelResizeValue - The resize value for the footer panel
 * @param {number} mapHeight - The height of the map
 * @param {number} rightTopHeight - The height of the right top panel
 * @param {boolean} footerBarIsCollapsed - Indicates if the footer bar is collapsed
 * @returns {string} The calculated maximum height value as a CSS-compatible string
 */
const calculateMaxHeight = (
  containerType: string,
  isMapFullScreen: boolean,
  footerPanelResizeValue: number,
  mapHeight: number,
  rightTopHeight: number,
  footerBarIsCollapsed: boolean
): string => {
  // eslint-disable-next-line no-param-reassign
  rightTopHeight = rightTopHeight < 50 ? 50 : rightTopHeight;

  // Base padding/margin values
  const baseOffset = 130;
  const fullScreenOffset = 110;

  if (containerType === CONTAINER_TYPE.FOOTER_BAR) {
    if (isMapFullScreen) {
      return `calc(${footerPanelResizeValue}vh - ${fullScreenOffset + rightTopHeight}px)`;
    }
    return `calc(575px - ${rightTopHeight}px)`;
  }

  // Handle APP_BAR case
  if (containerType === CONTAINER_TYPE.APP_BAR) {
    if (isMapFullScreen && !footerBarIsCollapsed) {
      return `calc(${100 - footerPanelResizeValue}vh - (${rightTopHeight}px + 155px))`;
    }

    if (isMapFullScreen && footerBarIsCollapsed) {
      return `calc(100vh - (${rightTopHeight}px + 200px))`;
    }
    return `calc(${mapHeight}px - ${baseOffset + rightTopHeight + 24}px)`;
  }

  return '100%';
};

/**
 *  Get custom sx classes for the common grid layout
 *
 * @param {Theme} theme - The MUI theme object containing styling configurations
 * @param {boolean} isMapFullScreen - Indicates if the map is in fullscreen mode
 * @param {number} footerPanelResizeValue - The resize value for the footer panel in pixels
 * @param {number} mapHeight - The height of the map component in pixels
 * @param {boolean} footerBarIsCollapsed - Indicates if the footer bar is collapsed
 * @param {string} containerType - The type of container being styled
 * @param {number} topHeight - The height of the top section in pixels
 * @returns {SxStyles} An object containing MUI SX styling properties
 */
export const getSxClasses = (
  theme: Theme,
  isMapFullScreen: boolean,
  footerPanelResizeValue: number,
  mapHeight: number,
  footerBarIsCollapsed: boolean,
  containerType: string,
  topHeight: number
): SxStyles => ({
  rightButtonsContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: '0.6rem',
    backgroundColor: theme.palette.geoViewColor.primary.lighten(0.5, 0.1),
    borderTopLeftRadius: '0.75rem',
    borderTopRightRadius: '0.5rem',
    padding: ' 0.5rem 0.5rem 0.5rem 1rem',
    borderTop: `0.2rem solid ${theme.palette.geoViewColor.primary.lighten(0.2, 0.4)}`,
    borderLeft: `0.2rem solid ${theme.palette.geoViewColor.primary.lighten(0.2, 0.4)}`,
    '& .MuiButton-startIcon': {
      [theme.breakpoints.down('md')]: {
        margin: 0,
      },
    },
  },
  rightMainContent: {
    border: `2px solid ${theme.palette.geoViewColor.primary.main}`,
    borderRadius: '5px',
    backgroundColor: theme.palette.geoViewColor.bgColor.light[300],
    // maxHeight: '100%',
    overflowY: 'auto',
    '&:focus-visible': {
      border: '2px solid inherit',
    },

    '&.guide-container': {
      backgroundColor: theme.palette.geoViewColor.white,
    },
    width: '100%',
    '&.fullscreen-mode': {
      maxHeight: 'calc(100vh - 90px)',
      '& > div': {
        maxHeight: 'calc(100vh - 120px)',
        overflow: 'auto',
      },
      '& .MuiTableContainer-root': {
        maxHeight: 'calc(100vh - 260px)',
      },
      '& .guidebox-container': {
        maxHeight: 'calc(100vh - 120px)',
        overflow: 'auto',
      },
    },

    '& .MuiPaper-root': {
      border: 'none',
    },
    '& .guideBox': {
      color: `${theme.palette.geoViewColor.grey.dark[800]}  !important`,
      margin: '1rem',
      img: {
        maxWidth: '100%',
      },
      td: {
        width: 'auto',
        paddingLeft: '15px',
      },
      th: {
        textAlign: 'left',
        paddingLeft: '15px',
      },
      '& h3': {
        '&:first-of-type': {
          display: 'flex',
          alignItems: 'center',
          gap: '0.325rem',
        },
      },
    },
  },
  gridRightMain: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    height: '100%'
  },
  gridLeftMain: {
    height: '100%',
    overflowY: 'auto',
  }
});
