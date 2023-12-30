import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
  stepper: {
    color: theme.palette?.text?.primary,
  },
});
