import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';
import { getFocusIndicatorStyles } from '@/ui/style/themeOptionsGenerator';
import { geoViewColors as defaultGeoViewColors } from '@/ui/style/default';

/**
 * Gets custom sx classes for the switch component.
 *
 * Uses optional chaining (?.) for theme.palette.geoViewColor properties
 * because plugins may render before GeoView's custom theme is fully initialized.
 *
 * @param theme - The MUI theme object
 * @returns The sx classes object
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  formControl: {
    margin: '0 5px',
    padding: '0 5px',
    borderRadius: '6px',
    gap: '4px',
    '&:has(.Mui-focusVisible)': {
      ...getFocusIndicatorStyles(theme.palette.geoViewColor ?? defaultGeoViewColors),
    },
    '& .MuiSwitch-root': {
      overflow: 'visible',
    },
    '& .MuiSwitch-switchBase.Mui-focusVisible': {
      color: theme.palette.primary.contrastText,
      background: theme.palette.geoViewColor?.primary.main,
      outlineColor: 'transparent',
      boxShadow: 'none',
    },
    '& .MuiFormControlLabel-label': {
      fontSize: theme.palette.geoViewFontSize?.default,
      color: 'inherit',
      whiteSpace: 'normal',
    },
  },
});
