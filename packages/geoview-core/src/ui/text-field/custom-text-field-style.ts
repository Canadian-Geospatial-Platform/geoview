import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
  textField: {
    width: '50%',
    margin: '10px 0',
    '& .MuiFormLabel-root.Mui-focused': {
      color: theme.palette?.primary?.contrastText,
      background: theme.palette.primary.light,
    },
    '& .MuiOutlinedInput-root.Mui-focused': {
      border: `1px solid ${theme.palette?.primary?.contrastText}`,
    },
  },
});
