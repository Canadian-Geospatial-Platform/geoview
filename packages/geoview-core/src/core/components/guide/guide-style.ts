import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';
import { visuallyHidden } from '@/ui/style/default';

/**
 * Gets reusable guide box styles for guide content.
 *
 * @param theme - The theme object
 * @returns The guide box sx styles object
 */
const getGuideBoxStyles = (theme: Theme): Object => ({
  color: theme.palette.geoViewColor?.grey.dark[800],
  padding: theme.spacing(2),
  '& td': {
    paddingTop: theme.spacing(0.5),
    '& img': {
      verticalAlign: 'bottom',
      width: '24px',
      height: '24px',
    },
  },
  '& h1': {
    marginBottom: theme.spacing(0.5),
    marginTop: theme.spacing(2),
    paddingBottom: theme.spacing(0.5),
    fontSize: theme.palette.geoViewFontSize?.xl,
    fontWeight: 700,
    borderBottom: `2px solid ${theme.palette.geoViewColor?.primary.main}`,
  },
  '& h2': {
    marginBottom: theme.spacing(0.5),
    marginTop: theme.spacing(3),
    paddingBottom: theme.spacing(0.5),
    fontSize: theme.palette.geoViewFontSize?.lg,
    fontWeight: 600,
    borderBottom: `2px solid ${theme.palette.geoViewColor?.secondary.main}`,
    '& img': {
      height: '30px',
      verticalAlign: 'middle',
    },
  },
  '& h3': {
    marginBottom: theme.spacing(0.5),
    marginTop: theme.spacing(2.5),
    paddingBottom: theme.spacing(0.5),
    fontSize: theme.palette.geoViewFontSize?.md,
    fontWeight: 600,
    borderBottom: `1px solid ${theme.palette.geoViewColor?.bgColor.dark[400]}`,
    '& img': {
      height: '25px',
      verticalAlign: 'bottom',
    },
  },
  '& h4': {
    marginBottom: theme.spacing(0.5),
    marginTop: theme.spacing(2),
    fontSize: theme.palette.geoViewFontSize?.default,
    fontWeight: 600,
    borderBottom: `1px solid ${theme.palette.geoViewColor?.bgColor.dark[100]}`,
    '& img': {
      verticalAlign: 'bottom',
    },
  },
  '& p': {
    marginBottom: theme.spacing(1.25),
    '& img': {
      height: '20px',
      verticalAlign: 'bottom',
    },
  },
  '& ul, & ol': {
    marginBottom: theme.spacing(1.25),
  },
  '& table': {
    marginBottom: theme.spacing(2),
  },
});

/**
 * Gets custom sx classes for the guide.
 *
 * @param theme - The theme object
 * @returns The sx classes object
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
      color: theme.palette.geoViewColor?.textColor.main,
      '& .search-highlight': {
        backgroundColor: theme.palette.warning.light,
        padding: theme.spacing(0.25, 0.5),
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
        padding: theme.spacing(2),
        fontSize: `${theme.palette.geoViewFontSize?.lg} !important`,
        lineHeight: 1.5,
        fontWeight: '700',
        textTransform: 'capitalize',
      },
    },
    footerGuideListItemCollapse: {
      '& .MuiListItemText-primary': {
        padding: theme.spacing(2, 2, 2, 3.75),
        fontSize: `${theme.palette.geoViewFontSize?.md} !important`,
        lineHeight: 1.5,
        whiteSpace: 'unset',
      },
    },
    errorMessage: {
      marginLeft: theme.spacing(7.5),
      marginTop: theme.spacing(3.75),
      marginBottom: theme.spacing(1.5),
    },
    guideSearch: {
      backgroundColor: theme.palette.geoViewColor?.bgColor.light[600],
      marginBottom: theme.spacing(1.25),
      width: '400px',
      maxWidth: '100%',
    },
    searchAdornmentContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(0.25),
    },
    searchMatchCount: {
      fontSize: theme.palette.geoViewFontSize?.xs,
      color: theme.palette.geoViewColor?.textColor.light[200],
      whiteSpace: 'nowrap',
    },
    searchNoResults: {
      fontSize: theme.palette.geoViewFontSize?.xs,
      color: theme.palette.geoViewColor?.textColor.light[200],
      whiteSpace: 'nowrap',
      mr: theme.spacing(0.125),
    },
    searchNavigationButton: {
      '&.Mui-focusVisible': {
        outlineOffset: '-3px',
        boxShadow: 'none',
      },
    },
    searchNavigationIcon: {
      fontSize: theme.palette.geoViewFontSize?.sm,
    },
    searchClearButton: {
      '&.Mui-focusVisible': {
        outlineOffset: '-3px',
        boxShadow: 'none',
      },
    },
    searchClearIcon: {
      fontSize: theme.palette.geoViewFontSize?.sm,
    },
    visuallyHidden,
  }) as const;
