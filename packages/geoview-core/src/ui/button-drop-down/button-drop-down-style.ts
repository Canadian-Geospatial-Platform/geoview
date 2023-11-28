import { Theme } from '@mui/material/styles';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
