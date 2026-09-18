import type { Theme, SxStyles } from 'geoview-core/ui/style/types';

/**
 * Returns the sx style classes for the About Panel components.
 *
 * @param theme - The MUI theme object
 * @returns The sx style classes
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  container: {
    padding: theme.spacing(2),
    height: '100%',
    overflow: 'auto',
  },
  markdownContainer: {
    '& h1, & h2, & h3, & h4, & h5, & h6': {
      marginTop: theme.spacing(2),
      marginBottom: theme.spacing(1.25),
    },
    '& p': {
      marginBottom: theme.spacing(2),
    },
    '& ul, & ol': {
      paddingLeft: theme.spacing(2),
      marginBottom: theme.spacing(2),
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
      borderRadius: theme.shape.borderRadius,
      fontFamily: 'monospace',
    },
    '& pre': {
      backgroundColor: theme.palette.action.hover,
      padding: theme.spacing(2),
      borderRadius: theme.shape.borderRadius,
      overflow: 'auto',
      '& code': {
        backgroundColor: 'transparent',
      },
    },
  },
  markdownItem: {
    marginBottom: theme.spacing(0.25),
  },
  defaultContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  },
  title: {
    marginTop: theme.spacing(2),
    fontSize: theme.palette.geoViewFontSize?.xl,
    fontWeight: theme.typography.fontWeightBold,
  },
  logoContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing(2),
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
    marginTop: theme.spacing(2),
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '200px',
  },
  errorContainer: {
    padding: theme.spacing(2),
  },
});
