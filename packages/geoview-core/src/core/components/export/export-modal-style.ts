import { Theme } from '@mui/material/styles';
import { SxProps } from '@mui/system';

type SxStyles = Record<string, SxProps<Theme>>;

/**
 * Get custom sx classes for the export modal
 *
 * @param {Theme} theme the theme object
 * @returns {Object} the sx classes object
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    padding: theme.spacing(2),
    '& .MuiFormControl-root': {
      marginTop: theme.spacing(2),
    },
  },
  exportContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(2),
  },
  mapContainer: {
    width: '100%',
    marginBottom: theme.spacing(2),
    '& img': {
      maxWidth: '100%',
      height: 'auto',
    },
  },
  legendContainer: {
    width: '100%',
    marginTop: theme.spacing(2),
    '& img': {
      maxWidth: '100%',
      height: 'auto',
    },
  },
  exportTitle: {
    width: '100%',
    textAlign: 'center',
    marginBottom: theme.spacing(2),
    color: theme.palette.text.primary,
  },
  attributionContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: theme.spacing(2),
    padding: theme.spacing(1),
    backgroundColor: theme.palette.background.default,
  },
  northArrowContainer: {
    display: 'flex',
    alignItems: 'center',
    '& svg': {
      width: '24px',
      height: '24px',
    },
  },
  scaleContainer: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.875rem',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '200px',
  },
  dialogContent: {
    minHeight: '400px',
    maxHeight: '80vh',
    overflow: 'auto',
  },
});
