import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
  vertical: {
    alignSelf: 'center',
    height: 40,
    width: 1,
    backgroundColor: theme.palette.primary.contrastText,
  },
  horizontal: {
    height: 1,
    backgroundColor: theme.palette.primary.contrastText,
  },
  grow: {
    flexGrow: 1,
    backgroundColor: theme.palette.primary.main,
  },
});
