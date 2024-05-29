export const sxClasses = {
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
};
