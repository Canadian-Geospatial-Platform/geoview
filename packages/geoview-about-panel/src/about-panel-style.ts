import type { SxStyles } from 'geoview-core/ui/style/types';

/**
 * Returns the sx style classes for the About Panel components.
 *
 * @param theme - The MUI theme object
 * @returns The sx style classes
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSxClasses = (theme: any): SxStyles => ({
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
    marginTop: '1rem',
    fontSize: '2rem',
    fontWeight: 600,
  },
  logoContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing(11),
  },
  description: {
    lineHeight: 1.6,
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
