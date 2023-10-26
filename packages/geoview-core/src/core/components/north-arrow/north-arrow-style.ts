import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
  northArrowContainer: {
    left: '50%',
    position: 'absolute',
  },
  northArrow: {
    width: theme.overrides?.northArrow?.size.width,
    height: theme.overrides?.northArrow?.size.height,
  },
});
