import type { SxProps, Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';
import { visuallyHidden } from '@/ui/style/default';
import { FOCUS_OUTLINE_WIDTH } from '@/ui/style/themeOptionsGenerator';

/**
 * Gets reusable guide box styles for guide content.
 *
 * @param theme - The theme object
 * @returns The guide box sx styles object
 */
const getGuideBoxStyles = (theme: Theme): SxProps<Theme> => ({
  position: 'relative',
  color: theme.palette.text.primary,
  padding: theme.spacing(2),
  '& h1': {
    marginBottom: theme.spacing(0.5),
    marginTop: theme.spacing(2),
    paddingBottom: theme.spacing(0.5),
    fontSize: theme.typography.h3.fontSize,
    fontWeight: 700,
    borderBottom: `2px solid ${theme.palette.primary.main}`,
  },
  '& h2': {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(0.5),
    marginTop: theme.spacing(3),
    paddingBottom: theme.spacing(0.5),
    fontSize: theme.typography.h4.fontSize,
    fontWeight: 600,
    overflowWrap: 'anywhere',
    wordBreak: 'normal',
    hyphens: 'auto',
    borderBottom: `2px solid ${theme.palette.secondary.main}`,
    '& img': {
      height: '30px',
      verticalAlign: 'middle',
      flexShrink: 0,
    },
    '& a': {
      flexShrink: 0,
    },
  },
  '& h3': {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(0.5),
    marginTop: theme.spacing(2.5),
    paddingBottom: theme.spacing(0.5),
    fontSize: theme.typography.h5.fontSize,
    fontWeight: 600,
    overflowWrap: 'anywhere',
    wordBreak: 'normal',
    hyphens: 'auto',
    borderBottom: `1px solid ${theme.palette.divider}`,
    '& img': {
      height: '25px',
      verticalAlign: 'bottom',
      flexShrink: 0,
    },
    '& a': {
      flexShrink: 0,
    },
  },
  '& h4': {
    marginBottom: theme.spacing(0.5),
    marginTop: theme.spacing(2),
    fontSize: theme.typography.h6.fontSize,
    fontWeight: 600,
    borderBottom: 'none',
    '& img': {
      verticalAlign: 'bottom',
    },
  },
  '& table': {
    marginBottom: theme.spacing(2),
  },
  '& td': {
    width: 'auto',
    paddingTop: theme.spacing(0.5),
    paddingLeft: theme.spacing(2),
    '& img': {
      verticalAlign: 'bottom',
      width: '24px',
      height: '24px',
    },
  },
  '& th': {
    textAlign: 'left',
    paddingLeft: theme.spacing(2),
  },
  '& img': {
    maxWidth: '100%',
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
    },
    rightPanelContainer: {
      color: theme.palette.text.primary,
      '& .search-highlight': {
        backgroundColor: theme.palette.warning.light,
        padding: theme.spacing(0.25, 0.5),
        borderRadius: theme.shape.borderRadiusSm,
      },
      '& .current-match': {
        backgroundColor: theme.palette.warning.main,
        color: theme.palette.warning.contrastText,
        fontWeight: 'bold',
      },
    },
    guideBox: getGuideBoxStyles(theme),
    errorMessage: {
      marginLeft: theme.spacing(7.5),
      marginTop: theme.spacing(3.75),
      marginBottom: theme.spacing(1.5),
    },
    guideSearch: {
      backgroundColor: theme.palette.background.paper,
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
      fontSize: theme.typography.caption.fontSize,
      color: theme.palette.text.secondary,
      whiteSpace: 'nowrap',
    },
    searchNoResults: {
      fontSize: theme.typography.caption.fontSize,
      color: theme.palette.text.secondary,
      whiteSpace: 'nowrap',
    },
    searchNavigationButton: {
      '&.Mui-focusVisible': {
        outlineOffset: `-${FOCUS_OUTLINE_WIDTH}`,
        boxShadow: 'none',
      },
    },
    searchClearButton: {
      '&.Mui-focusVisible': {
        outlineOffset: `-${FOCUS_OUTLINE_WIDTH}`,
        boxShadow: 'none',
      },
    },
    visuallyHidden,
  }) as const;
