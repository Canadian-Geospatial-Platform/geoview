import { Theme } from '@mui/material/styles';
import { SxProps } from '@mui/system';

type SxStyles = Record<string, SxProps<Theme>>;

/**
 * Get custom sx classes for the MUI select custom
 *
 * @param {Theme} theme the theme object
 * @returns {Object} the sx classes object
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  formControl: {
    width: '50%',
    '& .MuiFormLabel-root.Mui-focused': {
      color: theme.palette.primary.contrastText,
      background: theme.palette.geoViewColor?.primary.light,
    },
    '& .MuiOutlinedInput-root.Mui-focused': {
      border: `1px solid ${theme.palette.geoViewColor?.primary.contrastText}`,
    },
  },
  label: {
    position: 'absolute',
    left: 0,
    top: 0,
    transform: 'translate(14px, -9px) scale(0.75)',
    background: theme.palette.geoViewColor?.primary.light,
  },
  select: {
    width: '100%',
  },
});
