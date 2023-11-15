import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
  list: {
    color: 'text.primary',
    marginLeft: '1rem',
    width: '100%',
    paddingRight: '2rem',

    '& .layerItemContainer': {
      background: '#FFFFFF 0% 0% no-repeat padding-box',
      borderRadius: '5px',
      marginBottom: '5px',
      border: '10px solid red',
    },

    '& .MuiListItemText-primary': {
      font: theme.footerPanel.layerTitleFont,
    },

    '& .MuiListItem-root': {
      height: '100%',
      '& .MuiListItemButton-root': {
        padding: '0 0 0 16px',
        height: '100%',
      },
      '& .MuiBox-root': {
        height: '100%',
        borderTopRightRadius: '4px',
        borderBottomRightRadius: '4px',
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      },
    },

    '& .MuiListItemIcon-root': {
      minWidth: '2.5rem',
      marginRight: '20px',
    },
    '& .MuiListItemText-root': {
      '>span': {
        fontSize: '1rem',
      },
      '> p': {
        fontSize: '0.875rem',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
    },
  },
  oddDepthList: {
    background: theme.footerPanel.contentBg,
    boxShadow: theme.footerPanel.contentShadow,
    padding: '0px',
    margin: '20px',
    width: 'unset',
    boxSizing: 'border-box',
    '& .layerItemContainer': {
      backgroundColor: 'transparent',
      marginBottom: '0px',
    },
  },
  evenDepthList: {
    background: 'white',
    boxShadow: theme.footerPanel.contentShadow,
    padding: '0px',
    margin: '20px',
    width: 'unset',
    boxSizing: 'border-box',
    '& .layerItemContainer': {
      backgroundColor: 'transparent',
      marginBottom: '0px',
    },
  },
  layersList: {
    selectedLayerItem: {
      border: '2px solid #515BA5',
    },
  },
});
