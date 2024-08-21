export const sxClasses = {
  layerSwipe: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },

  handle: {
    backgroundColor: 'rgba(50,50,50,0.75)',
    color: '#fff',
    width: '24px',
    height: '24px',
  },

  bar: {
    position: 'absolute',
    backgroundColor: 'rgba(50,50,50,0.75)',
    zIndex: 151,
    boxSizing: 'content-box',
    margin: 0,
    padding: '0!important',
  },

  vertical: {
    width: '8px',
    height: '100%',
    cursor: 'col-resize',
    top: '0px!important',

    '& .handleContainer': {
      position: 'relative',
      width: '58px',
      height: '24px',
      zIndex: 1,
      top: '50%',
      left: '-25px',

      '& .handleR': {
        transform: 'rotate(90deg)',
        float: 'right',
      },

      '& .handleL': {
        transform: 'rotate(90deg)',
        float: 'left',
      },
    },
  },

  horizontal: {
    width: '100%',
    height: '8px',
    cursor: 'col-resize',
    left: '0px!important',

    '& .handleContainer': {
      position: 'relative',
      height: '58px',
      width: '24px',
      zIndex: 1,
      left: '50%',
      top: '-24px',

      '& .handleL': {
        verticalAlign: 'top',
        marginBottom: '8px',
      },
    },
  },
};
