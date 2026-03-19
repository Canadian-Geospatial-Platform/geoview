import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';

/**
 * Gets custom sx classes for the switch component.
 *
 * @param theme - The MUI theme object
 * @returns The sx classes object
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  formControl: {
    width: '100%',
    marginRight: '5px',
    marginLeft: '5px',
    borderRadius: '6px',
    gap: '4px',
    '&:has(.Mui-focusVisible)': {
      outline: `2px solid ${theme.palette.common.black}`,
      outlineOffset: '4px',
    },
    '& .MuiSwitch-switchBase.Mui-focusVisible': {
      color: theme.palette.primary.contrastText,
      background: theme.palette.geoViewColor?.primary.main,
    },
    '& .MuiFormControlLabel-label': {
      fontSize: theme.palette.geoViewFontSize.default,
      color: 'inherit',
      whiteSpace: 'normal',
    },
  },
});
