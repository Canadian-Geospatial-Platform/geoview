import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';

/**
 * Gets the selected-layer header styles.
 *
 * @param theme - The map theme
 * @returns The sx classes object
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  layerTitleAppBar: {
    width: '100%',
  },
  layerTitleFooterBar: {
    width: 'auto',
  },
  layerTitleWithoutToggle: {
    [theme.breakpoints.up('sm')]: {
      display: 'none',
    },
  },
});
