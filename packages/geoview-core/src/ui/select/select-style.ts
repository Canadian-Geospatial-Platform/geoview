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
    fontSize: theme.typography.body2.fontSize,
    width: '100%',
    color: theme.palette.text.primary,
    '& .MuiOutlinedInput-notchedOutline': {
      border: `1px solid ${theme.palette.divider}`,
      padding: theme.spacing(0, 1.5, 0, 1),
      '&[aria-hidden="true"]': {
        border: `1px solid ${theme.palette.divider}`,
      },
    },
    '&:hover': {
      '& .MuiOutlinedInput-notchedOutline': {
        border: `1px solid ${theme.palette.divider}`,
      },
    },
    '& .MuiFormLabel-root.Mui-focused': {
      color: theme.palette.primary.contrastText,
      background: theme.palette.primary.light,
    },
    '& .MuiSelect-select': {
      padding: theme.spacing(2, 1.5),
    },
    '& .MuiSvgIcon-root': {
      color: theme.palette.text.primary,
    },
  },
  label: {
    color: theme.palette.text.primary,
    fontSize: theme.typography.body1.fontSize,
  },
  menuItem: {
    fontSize: theme.typography.body2.fontSize,
  },
});
