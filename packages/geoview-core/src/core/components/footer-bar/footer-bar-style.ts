// footer-bar.tsx
export const sxClassesFooterBar = {
  footerBarContainer: {
    zIndex: 50,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: 'calc(100%)',
    minHeight: '35px',
    maxHeight: '35px',
    backdropFilter: 'blur(5px)',
    backgroundColor: '#000000cc',
    pointerEvents: 'all',
    position: 'absolute',
    left: '64px',
    bottom: 0,
    order: 3,
    gap: 0.5,
  },
  mouseScaleControlsContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: 20,
    '& button': {
      cursor: 'pointer',
      margin: 'auto',
    },
  },
  rotationControlsContainer: {
    display: 'flex',
    flexDirection: 'column',
    marginLeft: 20,
    alignItems: 'flex-end',
  },
};

// footer-bar-expand-button.tsx
export const sxClassesExportButton = {
  expandbuttonContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'primary.light',
    height: '30px',
    width: '30px',
    marginLeft: '5px',
  },
};

// footer-bar-rotation-button.tsx
export const sxClassesRotationButton = {
  rotationButton: {
    height: 25,
    width: 25,
    marginRight: 5,
  },
  rotationIcon: {
    fontSize: 'fontSize',
    width: '1.5em',
    height: '1.5em',
    color: 'primary.light',
  },
};
