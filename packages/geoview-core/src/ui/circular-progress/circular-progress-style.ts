import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';

/**
 * Gets custom sx classes for the circular progress component.
 *
 * @param theme - The MUI theme object
 * @returns The sx classes object
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: '0px',
    bottom: '0px',
    left: '0px',
    right: '0px',
    zIndex: 10000,
    backgroundColor: theme.palette.geoViewColor?.bgColor.dark[900],
    textAlign: 'center',
    opacity: 1,
  },
  progress: {
    width: '100px !important',
    height: '100px !important',
    position: 'absolute',
  },
});
