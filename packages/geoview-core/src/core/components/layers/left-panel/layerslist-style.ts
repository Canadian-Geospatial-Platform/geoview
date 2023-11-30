import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
  
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
