import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';

/**
 * Get custom sx classes for the guide
 *
 * @param {Theme} theme the theme object
 * @returns {Object} the sx classes object
 */
export const getSxClasses = (theme: Theme): SxStyles =>
  ({
    guideContainer: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      '& .responsive-layout-right-main-content': {
        backgroundColor: theme.palette.geoViewColor.white,
        '&:focus-visible': {
          border: '2px solid inherit',
        },
        '& td': {
          paddingTop: '5px',
          '& img': {
            verticalAlign: 'bottom',
          },
          '& img[src$=".svg"]': {
            width: '30px',
          },
        },
        '& h3': {
          marginBottom: '5px',
          marginTop: '20px',
        },
        '& h3 P': {
          marginBottom: 'auto',
          marginTop: 'auto',
        },
        '& h1': {
          marginBottom: '5px',
        },
        '& h3 img': {
          height: '25px',
        },
        '& p img': {
          height: '20px',
        },
      },
    },
    rightPanelContainer: {
      color: theme.palette.geoViewColor.textColor.main,
      '& .search-highlight': {
        backgroundColor: theme.palette.warning.light,
        padding: '2px 4px',
        borderRadius: '2px',
      },
      '& .current-match': {
        backgroundColor: theme.palette.warning.main,
        color: 'white',
        fontWeight: 'bold',
      },
    },
    footerGuideListItemText: {
      '&:hover': {
        cursor: 'pointer',
      },
      '& .MuiListItemText-primary': {
        padding: '15px',
        fontSize: `${theme.palette.geoViewFontSize.lg} !important`,
        lineHeight: 1.5,
        fontWeight: '700',
        textTransform: 'capitalize',
      },
    },
    footerGuideListItemCollapse: {
      '& .MuiListItemText-primary': {
        padding: '15px 15px 15px 30px',
        fontSize: `${theme.palette.geoViewFontSize.md} !important`,
        lineHeight: 1.5,
        whiteSpace: 'unset',
      },
    },
    errorMessage: {
      marginLeft: '60px',
      marginTop: '30px',
      marginBottom: '12px',
    },
    guideSearch: {
      backgroundColor: theme.palette.geoViewColor.bgColor.light[600],
      marginBottom: '10px',
      width: '400px',
      maxWidth: '100%',
    },
  }) as const;
