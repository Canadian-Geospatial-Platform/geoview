import type { Theme } from '@mui/material/styles';

// ? I doubt we want to define an explicit type for style properties?
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSxClasses = (theme: Theme): any => ({
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
      backgroundColor: theme.palette.geoViewColor.primary.light[600],
      border: `2px solid ${theme.palette.geoViewColor.primary.main}`,
      borderRadius: '50%',
    },
    '& .MuiSlider-markLabel': {
      fontSize: theme.palette.geoViewFontSize.xs,
      color: theme.palette.geoViewColor.textColor.main,
    },
  },
  controlHidden: {
    color: theme.palette.grey[600],
    fontStyle: 'italic',
    fontWeight: 'bold',
  },
});
