import { Theme } from '@mui/material/styles';
import { SxStyles } from '@/ui/style/types';

import { CONTAINER_TYPE } from '@/core/utils/constant';

/**
 *  Get custom sx classes for the common grid layout
 *
 * @param {Theme} theme - The MUI theme object containing styling configurations
 * @param {string} containerType - The type of container ('app-bar' or 'footer-bar')
 * @returns {SxStyles} An object containing MUI SX styling properties
 */
export const getSxClasses = (theme: Theme, containerType: string): SxStyles => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: containerType === CONTAINER_TYPE.FOOTER_BAR ? '20px 12px 12px 12px' : '20px 10px 10px 10px',
  },
  rightButtonsContainer: {
    backgroundColor: theme.palette.geoViewColor.bgColor.light[300],
    display: 'flex',
    flexDirection: 'row',
    gap: '0.6rem',
    borderTopLeftRadius: '0.5rem',
    borderTopRightRadius: '0.5rem',
    borderTop: `2px solid ${theme.palette.geoViewColor.primary.main}`,
    borderLeft: `2px solid ${theme.palette.geoViewColor.primary.main}`,
    borderRight: `2px solid ${theme.palette.geoViewColor.primary.main}`,
    '& .MuiButton-startIcon': {
      [theme.breakpoints.down('md')]: {
        margin: 0,
      },
    },
    '& .MuiButtonBase-root': {
      borderTop: 0,
      borderBottom: 0,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      '&.active': {
        backgroundColor: theme.palette.geoViewColor.primary.main,
        color: theme.palette.geoViewColor.white,
        boxShadow: 1,
      },
    },
    '& .MuiButtonGroup-firstButton': {
      borderLeft: 0,
    },
    '& .MuiButtonGroup-lastButton': {
      borderRight: 0,
    },
  },
  rightMainContent: {
    border: `2px solid ${theme.palette.geoViewColor.primary.main}`,
    borderRadius: '5px 0 5px 5px',
    backgroundColor: theme.palette.geoViewColor.bgColor.light[300],
    overflowY: 'auto',
    '&:focus-visible': {
      border: '2px solid inherit',
    },
    '&.guide-container': {
      backgroundColor: theme.palette.geoViewColor.white,
    },
    width: '100%',
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
    '&.fullscreen-mode': {
      a: {
        color: theme.palette.geoViewColor.primary.main,
        '&:hover': {
          color: theme.palette.geoViewColor.primary.dark[300],
        },
      },
    },
  },
  gridRightMain: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    height: '100%',
  },
  gridLeftMain: {
    height: '100%',
    overflowY: 'auto',
  },
});
