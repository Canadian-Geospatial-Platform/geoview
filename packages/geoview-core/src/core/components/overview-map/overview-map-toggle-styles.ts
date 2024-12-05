type SxClasses = Record<string, object>;

/**
 * Get custom sx classes for the overview map toggle
 *
 * @returns {Object} the sx classes object
 */
export const getSxClasses = (): SxClasses => ({
  toggleBtn: {
    transform: 'rotate(45deg)',
    color: 'black',
    zIndex: 150,
    '&:hover': {
      cursor: 'pointer',
    },

    '&.minimapOpen': {
      transform: 'rotate(-45deg)',
    },
    '&.minimapClosed': {
      transform: 'rotate(135deg)',
    },
  },
  toggleBtnContainer: {
    zIndex: 150,
    position: 'absolute',
    top: 0,
    right: 0,
  },
});
