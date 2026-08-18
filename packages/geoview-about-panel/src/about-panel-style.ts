import type { Theme, SxStyles } from 'geoview-core/ui/style/types';

/**
 * Returns the sx style classes for the About Panel components.
 *
 * @param theme - The MUI theme object
 * @returns The sx style classes
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  container: {
    padding: theme.spacing(11),
    height: '100%',
    overflow: 'auto',
  },
  markdownContainer: {
    '& h1, & h2, & h3, & h4, & h5, & h6': {
      marginTop: theme.spacing(11),
      marginBottom: theme.spacing(7),
    },
    '& p': {
      marginBottom: theme.spacing(11),
    },
    '& ul, & ol': {
      paddingLeft: theme.spacing(11),
      marginBottom: theme.spacing(11),
    },
    '& a': {
      color: theme.palette.primary.main,
      textDecoration: 'none',
      '&:hover': {
        textDecoration: 'underline',
      },
    },
    '& img': {
      display: 'block',
      maxWidth: '100%',
      height: 'auto',
    },
    '& code': {
      backgroundColor: theme.palette.action.hover,
      padding: theme.spacing(0.5, 1),
      borderRadius: theme.shape.borderRadius,
      fontFamily: 'monospace',
    },
    '& pre': {
      backgroundColor: theme.palette.action.hover,
      padding: theme.spacing(11),
      borderRadius: theme.shape.borderRadius,
      overflow: 'auto',
      '& code': {
        backgroundColor: 'transparent',
        padding: 0,
      },
    },
  },
  markdownItem: {
    marginBottom: theme.spacing(2),
  },
  defaultContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(11),
  },
  title: {
    marginTop: theme.spacing(11),
    fontSize: theme.palette.geoViewFontSize?.xl,
    fontWeight: theme.typography.fontWeightBold,
  },
  logoContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing(11),
    '& img': {
      display: 'block',
      maxWidth: '100%',
      height: 'auto',
    },
  },
  description: {
    lineHeight: theme.typography.body1.lineHeight,
  },
  linkContainer: {
    marginTop: theme.spacing(11),
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '200px',
  },
  errorContainer: {
    padding: theme.spacing(11),
  },
});
