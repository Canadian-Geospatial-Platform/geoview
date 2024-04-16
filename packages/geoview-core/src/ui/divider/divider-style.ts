import { Theme } from '@mui/material/styles';

// ? I doubt we want to define an explicit type for style properties?
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSxClasses = (theme: Theme): any => ({
  vertical: {
    alignSelf: 'center',
    height: 40,
    width: '1px !important',
    backgroundColor: theme.palette.primary.contrastText,
  },
  horizontal: {
    height: 1,
    backgroundColor: theme.palette.primary.contrastText,
  },
  grow: {
    flexGrow: 1,
    backgroundColor: theme.palette.geoViewColor?.primary.main,
  },
});
