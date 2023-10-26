export const sxClasses = {
  layersContainer: {
    overflow: 'hidden',
    overflowY: 'auto',
    width: '100%',
  },
  layerItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: '5px 0',
    padding: '10px 5px',
    boxSizing: 'content-box',
    '&:hover': {
      cursor: 'pointer',
      backgroundColor: '#c9c9c9',
    },
    zIndex: 1000,
    border: 'none',
    width: '100%',
  },
  layerParentText: {
    fontSize: '16px',
    fontWeight: 'bold',
  },
  layerCountTextContainer: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    height: '32px',
  },
  layerItemText: {
    fontSize: '14px',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    marginLeft: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  flexGroup: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'baseline',
    gap: 12,
  },
  flexGroupButton: {
    height: 38,
    minHeight: 38,
    width: 25,
    minWidth: 25,
    '& > div': {
      textAlign: 'center',
    },
  },
  slider: {
    width: '100%',
    paddingLeft: 20,
    paddingRight: 20,
  },
  legendSubLayerGroup: {
    display: 'flex',
    justifyContent: 'space-between',
  },
};
