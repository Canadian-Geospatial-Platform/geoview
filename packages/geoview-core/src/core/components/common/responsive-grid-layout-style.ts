import { Theme } from '@mui/material/styles';
import { SxStyles } from '@/ui/style/types';

import { CONTAINER_TYPE } from '@/core/utils/constant';

type SxClasses = Record<string, object>;

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
    padding: containerType === CONTAINER_TYPE.FOOTER_BAR ? '20px' : '0px 10px 10px 10px',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: getMaxHeight(isFullScreen, containerType, mapHeight), // maxHeight only when not fullscreen or app-bar
    height: getContainerHeight(containerType, isFullScreen, footerBarIsCollapsed, footerPanelResizeValue),
    overflowY: containerType === CONTAINER_TYPE.FOOTER_BAR || containerType === CONTAINER_TYPE.APP_BAR ? 'hidden' : 'auto',
  },
});

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
 * Get custom sx classes for the common grid layout
 *
 * @param {Theme} theme the theme object
 * @returns {Object} the sx classes object
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
  rightGridContentHeight: {
    zIndex: isMapFullScreen ? 'unset' : 100, // should be is full screen dialog
    '& > div:first-of-type': {
      // maxHeight: isMapFullScreen ? `calc(${footerPanelResizeValue}vh - 130px)` : '575px', // maxHeight only when not fullscreen

      maxHeight: calculateMaxHeight(containerType, isMapFullScreen, footerPanelResizeValue, mapHeight, topHeight, footerBarIsCollapsed),

      height: isMapFullScreen ? 'fit-content' : undefined, // height only when fullscreen (- padding)
      overflowY: 'auto',
    },
  },
  rightGridContent: {
    border: `2px solid ${theme.palette.geoViewColor.primary.main}`,
    borderRadius: '5px',
    backgroundColor: theme.palette.geoViewColor.bgColor.light[300],
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
  leftGridContentHeight: {
    zIndex: isMapFullScreen ? 'unset' : 100, // should be is full screen dialog
    // maxHeight: isMapFullScreen ? `calc(${footerPanelResizeValue}vh - 130px)` : '565px', // maxHeight only when not fullscreen

    maxHeight: calculateMaxHeight(containerType, isMapFullScreen, footerPanelResizeValue, mapHeight, topHeight, footerBarIsCollapsed),

    height: isMapFullScreen ? 'fit-content' : undefined, // height only when fullscreen (- padding)
    overflowY: 'auto',
  },
});
