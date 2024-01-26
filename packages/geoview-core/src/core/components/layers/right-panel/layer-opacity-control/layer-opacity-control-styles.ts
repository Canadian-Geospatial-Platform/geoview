import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
  layerOpacityControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '8px 20px 7px 15px',
    backgroundColor: theme.palette.geoViewColors.bgColorLight,
    '& .MuiSlider-mark': {
      width: '10px',
      height: '10px',
      opacity: 1,
      backgroundColor: '#ccc',
      border: '1px solid gray',
      borderRadius: '50%',
    },
    '& .MuiSlider-markLabel': {
      fontSize: '0.8em',
      color: 'gray',
    },
  },
});
