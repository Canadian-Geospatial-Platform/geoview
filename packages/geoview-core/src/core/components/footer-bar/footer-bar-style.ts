// footer-bar.tsx
export const sxClassesFooterBar = {
  footerBarContainer: {
    flexGrow: 1,
    zIndex: 50,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: 'calc(100%)',
    minHeight: '35px',
    maxHeight: '35px',
    backdropFilter: 'blur(5px)',
    backgroundColor: 'geoViewColors.bgColor.darkest',
    pointerEvents: 'all',
    gap: 0.5,
    order: 3,
  },
  mouseScaleControlsContainer: {
    display: 'flex',
    flexDirection: 'row',
    '& button': {
      cursor: 'pointer',
      margin: 'auto 0 auto auto',
    },
    justifyContent: 'end',
  },
  rotationControlsContainer: {
    display: 'flex',
    flexDirection: 'column',
    marginLeft: '20px',
    alignItems: 'flex-end',
  },
};

// footer-bar-expand-button.tsx
export const sxClassesExportButton = {
  expandbuttonContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'geoViewColors.primaryLight',
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
    color: 'geoViewColors.primaryLight',
  },
};
