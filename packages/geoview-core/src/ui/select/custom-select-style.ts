import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
  formControl: {
    width: '50%',
    '& .MuiFormLabel-root.Mui-focused': {
      color: theme.palette.primary.contrastText,
      background: theme.palette.primary.light,
    },
    '& .MuiOutlinedInput-root.Mui-focused': {
      border: `1px solid ${theme.palette.primary.contrastText}`,
    },
  },
  label: {
    position: 'absolute',
    left: 0,
    top: 0,
    transform: 'translate(14px, -9px) scale(0.75)',
    background: theme.palette.primary.light,
  },
  select: {
    width: '100%',
  },
});
