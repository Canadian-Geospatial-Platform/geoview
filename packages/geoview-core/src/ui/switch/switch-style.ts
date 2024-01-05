import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
  formControl: {
    width: '100%',
    marginRight: '5px',
    marginLeft: '5px',
    '& .MuiSwitch-switchBase.Mui-focusVisible': {
      color: theme.palette.primary.contrastText,
      background: theme.palette.primary.light,
    },
    '& .MuiFormControlLabel-label': {
      fontSize: theme.typography.fontSize,
      color: theme.palette.primary.light,
      whiteSpace: 'nowrap',
    },
  },
});
