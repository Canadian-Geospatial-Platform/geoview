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
      padding: '5px 5px',
      fontSize: '1.15rem !important',
      lineHeight: 1.5,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },

    '& .layerItemContainer': {
      background: '#FFFFFF 0% 0% no-repeat padding-box',
      borderRadius: '5px',
      marginBottom: '1rem',

      '& .MuiListItemText-root': {
        marginLeft: '12px',
      },

      // for selected layer
      '&.selectedLayer': {
        border: '2px solid #515BA5',
      },

      // for handling layer status
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

      // styling right icons
      '& .rightIcons-container': {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'right',
        alignItems: 'center',

        '& .MuiIconButton-root': {
          color: `${theme.palette.primary.main} !important`,
          background: `${theme.palette.grey.A100} !important`,
          margin: '0px 5px',
        },
      },
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
  // descriptions for right panel with buttons(describing what each panel does)
  buttonDescriptionContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
});
