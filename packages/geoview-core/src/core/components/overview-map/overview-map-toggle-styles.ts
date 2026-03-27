/** Record of sx class definitions. */
type SxClasses = Record<string, object>;

/**
 * Gets custom sx classes for the overview map toggle.
 *
 * @returns The sx classes object
 */
export const getSxClasses = (): SxClasses => ({
  toggleBtnContainer: {
    zIndex: 150,
    position: 'absolute',
    top: 0,
    right: 0,
  },
  toggleBtn: {
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
