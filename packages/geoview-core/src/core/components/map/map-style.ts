export const sxClasses = {
  mapContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    position: 'relative',

    '& .ol-overviewmap.ol-custom-overviewmap': {
      bottom: 'auto',
      left: 'auto',
      right: '5px',
      top: '5px',
      margin: 5,
      order: 1,
      padding: 0,
      position: 'absolute',
      borderRadius: 4,

      '& .ol-overviewmap-map': {
        border: 'none',
        display: 'block !important',
        '-webkit-transition': '300ms linear',
        '-moz-transition': '300ms linear',
        '-o-transition': '300ms linear',
        '-ms-transition': '300ms linear',
        transition: '300ms linear',
      },
      '&.ol-uncollapsible': {
        bottom: 'auto',
        left: 'auto',
        right: 100,
        top: 100,
        margin: 5,
      },
      '&:not(.ol-collapsed)': {
        boxShadow: '0 1px 5px rgb(0 0 0 / 65%)',
        borderRadius: '4px',
        border: 'none',
      },
      '&:is(.ol-collapsed)': {
        boxShadow: '0 1px 5px rgb(0 0 0 / 65%)',
        borderRadius: 4,
        border: 'none',
      },
      '& button': {
        zIndex: 100,
        position: 'absolute',
        top: 0,
        right: 0,
        left: 'auto !important',
        bottom: 'auto !important',
        backgroundColor: '#cccccc',
      },
      '&::before': {
        content: '""',
        display: 'block',
        position: 'absolute',
        width: 0,
        height: 0,
        borderRadius: 2,
        zIndex: 100,
        right: 0,
        top: 0,
      },
      '& .ol-overviewmap-box': {
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
      },
      '& .ol-viewport': {
        borderRadius: '4px',
        '& .ol-layer': {
          backgroundColor: '#FFF',
        },
      },
    },
  },
};
