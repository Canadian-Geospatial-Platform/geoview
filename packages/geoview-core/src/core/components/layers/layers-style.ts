import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
  list: {
    color: 'text.primary',
    width: '100%',

    '& .layerItemContainer': {
      background: '#FFFFFF 0% 0% no-repeat padding-box',
      borderRadius: '5px',
      marginBottom: '5px',
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
  legendContainer: {
    background: theme.footerPanel.contentBg,
    boxShadow: theme.footerPanel.contentShadow,
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
  },
  legendTitle: {
    textAlign: 'left',
    fontFamily: 'Open Sans, Semibold',
    fontSize: '18px',
  },
  categoryTitleContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '15px',
  },
  categoryTitle: {
    textAlign: 'left',
    font: theme.footerPanel.titleFont,
    fontSize: '20px',
  },
  legendButton: {
    font: 'normal normal medium 16px/611px Noto Sans Myanmar',
    color: '#515BA5',
    backgroundColor: '#F4F5FF',
    fontWeight: 'bold',
    fontSize: '16px',
  },
  legendButtonText: {
    font: 'normal normal medium 16px/611px Noto Sans Myanmar',
    textTransform: 'capitalize',
    fontWeight: 'bold',
    color: '#515BA5',
    fontSize: '16px',
  },
  legendItemContainer: {
    border: '2px solid red',
    width: '100%',
  },
  layersList: {
    layerItem: {
      background: '#FFFFFF 0% 0% no-repeat padding-box',
      borderRadius: '5px',
      marginBottom: '5px',
    },
    selectedLayerItem: {
      border: '2px solid #515BA5',
    },
  },
  rightPanel: {
    layerDetails: {
      border: '2px solid #515BA5',
      padding: '20px',
    },
    opacityMenu: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      padding: '8px 20px 7px 15px',
      backgroundColor: '#F6F6F6',
    },
    tableIconLabel: {
      color: 'text.primary',
      fontSize: 16,
      noWrap: true,
      marginLeft: 20,
    },
    table: {
      border: '1px solid #C1C1C1',
      borderRadius: '4px',
      padding: '16px 17px 16px 23px',
    },
    tableHeader: {
      '& th': {
        borderBottom: '1px solid #C1C1C1',
        height: 40,
        backgroundColor: '#FFFFFF',
        padding: '2px 4px 2px 4px',
        borderRight: '1px solid #C1C1C1',
        fontWeight: 'bold',
      },
      '& th:first-child': {
        width: '80px',
      },
      '& th:nth-child(2)': {
        padding: '2px 4px 2px 20px',
      },
    },
    tableRow: {
      '& td': {
        borderBottom: '1px solid #C1C1C1',
        height: 40,
        margin: 0,
        padding: '2px 4px 2px 4px',
        alignItems: 'center',
        borderRight: '1px solid #C1C1C1',
      },
      '& td:first-child': {
        width: '80px',
      },
      '& td:nth-child(2)': {
        padding: '2px 4px 2px 20px',
      },
    },
  },
});
