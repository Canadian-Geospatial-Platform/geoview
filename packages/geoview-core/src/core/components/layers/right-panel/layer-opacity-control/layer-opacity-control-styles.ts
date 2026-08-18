import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';

/**
 * Gets the sx classes for the layer opacity control.
 *
 * @param theme - The MUI theme object
 * @returns The sx style classes
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  layerOpacityControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '8px 20px 7px 15px',
    marginLeft: 'auto',
    width: '235px',
    backgroundColor: 'transparent',
    borderRadius: '10px',
    '& .MuiSlider-mark': {
      width: '9px',
      height: '9px',
      opacity: 1,
      backgroundColor: theme.palette.geoViewColor?.primary.light[600],
      border: `2px solid ${theme.palette.geoViewColor?.primary.main}`,
      borderRadius: '50%',
    },
    '& .MuiSlider-markLabel': {
      fontSize: theme.palette.geoViewFontSize?.xs,
      color: theme.palette.geoViewColor?.textColor.main,
    },
  },
  controlHidden: {
    color: theme.palette.grey[600],
    fontStyle: 'italic',
    fontWeight: 'bold',
  },
  controlVisible: {
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
  },
});
