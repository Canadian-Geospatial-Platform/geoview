import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';

/**
 * Gets custom sx classes for the focus trap container.
 *
 * @param theme - The MUI theme object
 * @returns The sx classes object
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'clip',
    height: '100%',
  },
  withExitButton: {
    paddingTop: theme.spacing(2),
  },
  exitButton: {
    width: '95%',
    margin: `${theme.spacing(1.25)} auto`,
    flexShrink: 0,
    display: 'block',
  },
  content: {
    flex: 1,
    minHeight: 0,
  },
});
