import { Theme } from '@mui/material/styles';

// ? I doubt we want to define an explicit type for style properties?
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSxClasses = (theme: Theme): any => ({
  formControl: {
    width: '50%',
    '& .MuiFormLabel-root.Mui-focused': {
      color: theme.palette.primary.contrastText,
      background: theme.palette.geoViewColor?.primary.light,
    },
    '& .MuiOutlinedInput-root.Mui-focused': {
      border: `1px solid ${theme.palette.geoViewColor?.primary.contrastText}`,
    },
  },
  label: {
    position: 'absolute',
    left: 0,
    top: 0,
    transform: 'translate(14px, -9px) scale(0.75)',
    background: theme.palette.geoViewColor?.primary.light,
  },
  select: {
    width: '100%',
  },
});
