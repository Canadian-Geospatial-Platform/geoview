import type { Theme } from '@mui/material/styles';

/** Record of sx class definitions. */
type SxClasses = Record<string, object>;

/**
 * Gets custom sx classes for the overview map toggle.
 *
 * @param theme - The MUI theme object
 * @returns The sx classes object
 */
export const getSxClasses = (theme: Theme): SxClasses => ({
  toggleBtnContainer: {
    zIndex: 150,
    position: 'absolute',
    top: 0,
    right: 0,
  },
  toggleBtn: {
    margin: theme.spacing(0),
    padding: theme.spacing(0),
    height: 'initial',
    minWidth: 'initial',
    color: 'black',
    zIndex: 150,
    transform: 'rotate(45deg)',
    transition: 'transform 0.3s ease',
    cursor: 'pointer',
    '&.minimapOpen': {
      transform: 'rotate(-45deg)',
    },
    '&.minimapClosed': {
      transform: 'rotate(135deg)',
    },
    '&:hover': {
      opacity: 0.8,
    },
  },
});
