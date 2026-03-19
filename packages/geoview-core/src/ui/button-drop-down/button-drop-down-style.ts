import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';

/**
 * Gets custom sx classes for the button drop down component.
 *
 * @param theme - The MUI theme object
 * @returns The sx classes object
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  buttonDropDown: {
    display: 'flex',
    fontSize: theme?.typography?.fontSize,
    color: theme.palette.geoViewColor?.primary.dark,
    backgroundColor: theme.palette.geoViewColor?.bgColor.dark[50],
  },
  buttonText: {},
  buttonArrow: {
    display: 'flex',
    color: theme?.palette?.primary?.dark,
    width: 'auto',
  },
});
