import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
  list: {
    color: 'text.primary',
    width: '100%',
    padding: '8px',
    overflowY: 'auto',
    // layer title
    '& .MuiListItemText-primary': {
      fontWeight: '600',
      padding: '5px 0px',
      fontSize: '1.15rem !important',
      lineHeight: 1.5,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },

    '& .layerItemContainer': {
      background: `${theme.palette.geoViewColor.bgColor.light[600]} 0% 0% no-repeat padding-box`,
      borderRadius: '5px',
      marginBottom: '1rem',

      '& .MuiListItemText-root': {
        marginLeft: '12px',
      },

      // for selected layer
      '&.selectedLayer': {
        borderColor: theme.palette.geoViewColor.primary.main,
        borderWidth: '2px',
        borderStyle: 'solid',
      },

      '&.dragging': {
        backgroundcolor: theme.palette.geoViewColor.primary.dark[600],
        cursor: 'grab',
        userSelect: 'none',
      },

      // for handling layer status
      '&.error': {
        background: theme.palette.geoViewColor.error.light[400],
        '& .MuiListItemText-secondary': {
          fontWeight: 'bold',
          color: theme.palette.geoViewColor.error.main,
        },
      },
      '&.loading': {
        background: theme.palette.geoViewColor.info.light[600],
        '& .MuiListItemText-secondary': {
          fontWeight: 'bold',
          color: theme.palette.geoViewColor.info.main,
        },
      },

      // styling right icons
      '& .rightIcons-container': {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'right',
        alignItems: 'center',

        '& .MuiIconButton-root': {
          color: `${theme.palette.geoViewColor.primary.main} !important`,
          background: `${theme.palette.geoViewColor.bgColor.dark[100]} !important`,
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
  evenDepthList: {
    background: theme.palette.geoViewColor.bgColor.main,
    boxShadow: 2,
    padding: '0px',
    margin: '20px',
    width: 'unset',
    boxSizing: 'border-box',
    '& .layerItemContainer': {
      backgroundColor: 'transparent',
      marginBottom: '0px',
    },
  },
  oddDepthList: {
    background: 'white',
    boxShadow: 2,
    padding: '0px',
    margin: '20px',
    width: 'unset',
    boxSizing: 'border-box',
    '& .layerItemContainer': {
      backgroundColor: 'transparent',
      marginBottom: '0px',
    },
  },
});
