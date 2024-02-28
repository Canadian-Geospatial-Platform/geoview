import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
  buttonDropDown: {
    display: 'flex',
    fontSize: theme?.typography?.fontSize,
    height: 50,
  },
  buttonText: {},
  buttonArrow: {
    display: 'flex',
    color: theme?.palette?.primary?.dark,
    width: 'auto',
  },
});
