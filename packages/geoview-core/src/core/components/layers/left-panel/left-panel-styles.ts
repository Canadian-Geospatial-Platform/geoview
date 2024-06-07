import { Theme } from '@mui/material/styles';

// ? I doubt we want to define an explicit type for style properties?
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSxClasses = (theme: Theme): any => ({
  list: {
    color: 'text.primary',
    width: '100%',
    paddingLeft: '8px',
    paddingRight: '14px !important',
    overflowY: 'auto',
    // layer title
    '& .MuiListItemText-primary': {
      fontWeight: '600',
      padding: '5px 0px',
      fontSize: `${theme.palette.geoViewFontSize.default} !important`,
      lineHeight: 1.5,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },

    '& .layer-panel': {
      '& .MuiListItemText-root': {
        marginLeft: '12px',
      },

      // styling right icons
      '& .rightIcons-container': {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'right',
        alignItems: 'center',

        '& .MuiIconButton-root': {
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
        fontSize: theme.palette.geoViewFontSize.default,
      },
      '> p': {
        fontSize: theme.palette.geoViewFontSize.sm,
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
