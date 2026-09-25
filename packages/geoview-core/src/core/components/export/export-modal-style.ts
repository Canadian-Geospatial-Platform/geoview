import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';

/**
 * Gets custom sx classes for the export modal.
 *
 * @param theme - The theme object
 * @returns The sx classes object
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  dialogContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: theme.spacing(2),
    margin: '0 auto',
    padding: `${theme.spacing(2)} 10%`,
    width: '100%',
    overflowX: 'hidden',
    flex: '1 0 auto',
    justifyContent: 'center',
  },

  exportSettings: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    justifyContent: 'space-between',
    marginBottom: theme.spacing(0.25),
    [theme.breakpoints.up('md')]: {
      flexDirection: 'row',
    },
  },

  exportTitleInput: {
    flex: '0 0 min(300px, 100%)',
    '& input:focus-visible': {
      // MUI adds a 2px border to the bottom of the input parent on focus.
      // It has sufficient contrast to meet WCAG 2.1 requirements (see Success Criterion 1.4.11 and 2.4.7)
      border: 'none !important',
    },
  },

  exportOptions: {
    display: 'flex',
    flexDirection: 'row',
    flex: '1 1 auto',
    gap: theme.spacing(2),
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    '& .MuiFormControl-root': {
      minWidth: '100px',
      width: 'auto',
    },
    '& .MuiInputLabel-formControl': {
      fontSize: theme.palette.geoViewFontSize?.default,
      marginTop: theme.spacing(0),
    },
    '& .MuiInputLabel-formControl.Mui-focused': {
      color: theme.palette.text.primary,
    },
    '& .MuiInputBase-input.MuiSelect-select': {
      padding: theme.spacing(0, 1.5, 0.5, 0),
    },
    [theme.breakpoints.down('md')]: {
      flexDirection: 'column',
      '& .MuiFormControl-root': {
        width: '100%',
      },
    },
  },

  mapPreview: {
    maxWidth: '100%',
    width: 'auto',
    height: 'auto',
    border: '1px solid #ccc',
    objectFit: 'contain',
  },

  mapSkeletonMargin: {
    margin: '0 auto',
  },

  mapLoading: {
    maxWidth: '80%',
    width: 'auto',
    height: 'auto',
    border: '1px solid #ccc',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  dialogActions: {
    flexWrap: 'wrap',
    padding: theme.spacing(2),
    gap: theme.spacing(1),
  },
});
