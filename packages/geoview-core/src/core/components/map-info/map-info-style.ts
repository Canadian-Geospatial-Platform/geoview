// map-info.tsx
export const sxClassesMapInfo = {
  mapInfoContainer: {
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
    backgroundColor: '#000000cc',
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

// map-info-expand-button.tsx
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

// map-info-rotation-button.tsx
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
