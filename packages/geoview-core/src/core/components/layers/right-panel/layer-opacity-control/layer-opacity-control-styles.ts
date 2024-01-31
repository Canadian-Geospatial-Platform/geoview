import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
  layerOpacityControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '8px 20px 7px 15px',
    backgroundColor: theme.palette.geoViewColors.bgColor.main,
    borderRadius: '10px',
    '& .MuiSlider-mark': {
      width: '9px',
      height: '9px',
      opacity: 1,
      backgroundColor: theme.palette.geoViewColors.primary.light[600],
      border: `2px solid ${theme.palette.geoViewColors.primary.main}`,
      borderRadius: '50%',
    },
    '& .MuiSlider-markLabel': {
      fontSize: 'geoViewText.xs',
      color: theme.palette.geoViewColors.textColor.main,
    },
  },
});
