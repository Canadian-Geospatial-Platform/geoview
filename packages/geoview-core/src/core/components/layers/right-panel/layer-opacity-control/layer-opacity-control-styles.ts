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
    gap: theme.spacing(2),
    padding: theme.spacing(1, 2.5, 1, 2),
    marginLeft: 'auto',
    minWidth: '250px',
    backgroundColor: 'transparent',
    '& .MuiSlider-mark': {
      width: '9px',
      height: '9px',
      opacity: 1,
      backgroundColor: theme.palette.primary.light,
      border: `2px solid ${theme.palette.primary.main}`,
      borderRadius: theme.shape.borderRadiusFull,
    },
    '& .MuiSlider-markLabel': {
      fontSize: theme.typography.caption.fontSize,
      color: theme.palette.text.primary,
    },
  },
  controlLabel: {
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
  },
  controlLabelHidden: {
    color: theme.palette.text.disabled,
    fontStyle: 'italic',
  },
});
