import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';

/**
 * Gets custom sx classes for the select component.
 *
 * @param theme - The MUI theme object
 * @returns The sx classes object
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  formControl: {
    fontSize: theme.palette.geoViewFontSize?.sm,
    width: '100%',
    color: theme.palette.text.primary,
    '& .MuiOutlinedInput-notchedOutline': {
      border: `1px solid ${theme.palette?.border?.primary}`,
      padding: '0 12px 0 8px',
      '&[aria-hidden="true"]': {
        border: `1px solid ${theme.palette?.border?.primary}`,
      },
    },
    '&:hover': {
      '& .MuiOutlinedInput-notchedOutline': {
        border: `1px solid ${theme.palette?.border?.primary}`,
      },
    },
    '& .MuiFormLabel-root.Mui-focused': {
      color: theme.palette.primary.contrastText,
      background: theme.palette.geoViewColor?.primary.light,
    },
    '& .MuiSelect-select': {
      padding: '16px 12px',
    },
    '& .MuiSvgIcon-root': {
      color: theme.palette.text.primary,
    },
  },
  label: {
    color: theme.palette.text.primary,
    fontSize: theme.palette.geoViewFontSize?.default,
  },
  menuItem: {
    fontSize: theme.palette.geoViewFontSize?.sm,
  },
});
