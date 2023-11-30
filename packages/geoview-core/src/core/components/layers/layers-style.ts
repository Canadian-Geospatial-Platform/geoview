import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
  layersPanelContainer: {
    background: theme.footerPanel.contentBg,
    boxShadow: theme.footerPanel.contentShadow,
    padding: '1rem 0',
  },
  list: {
    color: 'text.primary',
    width: '100%',

    // layer title
    '& .MuiListItemText-primary': {
      font: theme.footerPanel.layerTitleFont,
      padding:'5px 5px',
      fontSize: '1.15rem !important',
      lineHeight: 1.5,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },

    '& .layerItemContainer': {
      background: '#FFFFFF 0% 0% no-repeat padding-box',
      borderRadius: '5px',
      marginBottom: '5px',

      //for handling layer status
      '&.error': {
        background: '#ffdcdb 0% 0% no-repeat padding-box',
        '& .MuiListItemText-secondary': {
          fontWeight: 'bold',
          color: 'error.main',
        },
      },
      '&.loading': {
        background: '#e5efff 0% 0% no-repeat padding-box',
        '& .MuiListItemText-secondary': {
          fontWeight: 'bold',
          color: 'info.main',
        },
      },

      //styling right icons
      '& .rightIcons-container': {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'right',
        alignItems: 'center',

        '& .MuiIconButton-root': {
            color: `${theme.palette.primary.main} !important`, 
            background: `${theme.palette.grey.A100} !important`,
            margin: '0px 5px'
        }
      }
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
    buttonDescriptionContainer: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
    },
    opacityMenu: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      padding: '8px 20px 7px 15px',
      backgroundColor: '#F6F6F6',
    },

    itemsGrid: {
      width: '100%',
      '& .MuiGrid-container': {
        '&:first-of-type': {
          fontWeight: 'bold',
          borderTop: '1px solid #ccc',
          borderBottom: '2px solid #ccc',
        },
        '& .MuiGrid-item': {
          padding: '3px 6px',

          '&:first-of-type': {
            width: '80px',
          },
          '&:nth-of-type(2)': {
            flexGrow: 1,
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
          },
        },
      },
    },
    tableIconLabel: {
      color: 'text.primary',
      fontSize: 16,
      noWrap: true,
      marginLeft: 20,
    },
  },
});
