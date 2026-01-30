import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';

/**
 * Get reusable guide box styles for guide content
 *
 * @param {Theme} theme the theme object
 * @returns {Object} the guide box sx styles object
 */
const getGuideBoxStyles = (theme: Theme): Object => ({
  color: theme.palette.geoViewColor.grey.dark[800],
  padding: '16px',
  '& td': {
    paddingTop: '5px',
    '& img': {
      verticalAlign: 'bottom',
      width: '24px',
      height: '24px',
    },
  },
  '& h1': {
    marginBottom: '5px',
    marginTop: '15px',
    paddingBottom: '5px',
    fontSize: theme.palette.geoViewFontSize.xl,
    fontWeight: 700,
    borderBottom: `2px solid ${theme.palette.geoViewColor.primary.main}`,
  },
  '& h2': {
    marginBottom: '5px',
    marginTop: '25px',
    paddingBottom: '5px',
    fontSize: theme.palette.geoViewFontSize.lg,
    fontWeight: 600,
    borderBottom: `2px solid ${theme.palette.geoViewColor.secondary.main}`,
    '& img': {
      height: '30px',
      verticalAlign: 'middle',
    },
  },
  '& h3': {
    marginBottom: '5px',
    marginTop: '20px',
    paddingBottom: '5px',
    fontSize: theme.palette.geoViewFontSize.md,
    fontWeight: 600,
    borderBottom: `1px solid ${theme.palette.geoViewColor.bgColor.dark[400]}`,
    '& img': {
      height: '25px',
      verticalAlign: 'bottom',
    },
  },
  '& h4': {
    marginBottom: '5px',
    marginTop: '15px',
    fontSize: theme.palette.geoViewFontSize.default,
    fontWeight: 600,
    borderBottom: `1px solid ${theme.palette.geoViewColor.bgColor.dark[100]}`,
    '& img': {
      verticalAlign: 'bottom',
    },
  },
  '& p': {
    marginBottom: '10px',
    '& img': {
      height: '20px',
      verticalAlign: 'bottom',
    },
  },
  '& ul, & ol': {
    marginBottom: '10px',
  },
  '& table': {
    marginBottom: '15px',
  },
});

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
        '&:focus-visible': {
          border: '2px solid inherit',
        },
      },
      // Scope all guide-specific styles under .guideBox to prevent collision with other components
      '& .guideBox': getGuideBoxStyles(theme),
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
      // Scope all guide-specific styles under .guideBox to prevent collision with other components
      '& .guideBox': getGuideBoxStyles(theme),
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
