import { Theme } from '@mui/material/styles';

// ? I doubt we want to define an explicit type for style properties?
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSxClasses = (theme: Theme): any => ({
  formControl: {
    width: '100%',
    marginRight: '5px',
    marginLeft: '5px',
    '& .MuiSwitch-switchBase.Mui-focusVisible': {
      color: theme.palette.primary.contrastText,
      background: theme.palette.geoViewColor?.primary.light,
    },
    '& .MuiFormControlLabel-label': {
      fontSize: theme.palette.geoViewFontSize.default,
      color: 'inherit',
      whiteSpace: 'nowrap',
    },
  },
});
