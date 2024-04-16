import { Theme } from '@mui/material/styles';

// ? I doubt we want to define an explicit type for style properties?
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSxClasses = (theme: Theme): any => ({
  northArrowContainer: {
    left: '50%',
    position: 'absolute',
  },
  northArrow: {
    width: theme.overrides?.northArrow?.size.width,
    height: theme.overrides?.northArrow?.size.height,
  },
});
