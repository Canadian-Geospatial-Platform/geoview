import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';

/**
 * Gets custom sx classes for the Settings panel.
 *
 * @param theme - The MUI theme object
 * @returns The sx classes object
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  popper: {
    pointerEvents: 'auto',
    zIndex: theme.zIndex.modal,
  },
  panel: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: '280px',
    maxWidth: 'min(420px, 70vw)',
    marginLeft: theme.spacing(1),
    color: theme.palette.text.primary,
    backgroundColor: theme.palette.background.paper,
    boxShadow: 2,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: '48px',
    padding: theme.spacing(0.5, 1, 0.5, 2),
    borderBottom: `1px solid ${theme.palette.divider}`,
    gap: theme.spacing(2),
  },
  title: {
    minWidth: 0,
    color: theme.palette.text.primary,
  },
  content: {
    padding: theme.spacing(1),
  },
});
