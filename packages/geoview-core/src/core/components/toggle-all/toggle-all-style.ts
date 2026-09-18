import type { Theme } from '@mui/material/styles';
import type { SxProps } from '@mui/material';

/** Default styles for the toggle all container. */
export const getToggleAllStyles = (theme: Theme): SxProps<Theme> => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(0.5),
  alignItems: 'center',
});
