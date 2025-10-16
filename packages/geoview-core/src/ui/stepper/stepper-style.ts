import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';

/**
 * Get custom sx classes for the MUI stepper
 *
 * @param {Theme} theme the theme object
 * @returns {Object} the sx classes object
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  stepper: {
    color: theme.palette.text.primary,
  },
});
