import type { Theme } from '@mui/material/styles';

type SxClasses = Record<string, object>;

/**
 * Get custom sx classes for the layer left panel
 *
 * @param {Theme} theme the theme object
 * @returns {Object} the sx classes object
 */
export const getSxClasses = (theme: Theme): SxClasses => ({
  list: {
    color: 'text.primary',
    width: '100%',
    paddingRight: '14px !important',
    overflowY: 'auto',
    // layer title
    '& .MuiListItemText-primary': {
      fontWeight: '600',
      fontSize: `${theme.palette.geoViewFontSize.default} !important`,
      display: '-webkit-box',
      WebkitLineClamp: '3',
      WebkitBoxOrient: 'vertical',
      whiteSpace: 'normal',
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
          margin: '0px 1px',
        },
      },
    },

    '& .MuiListItem-root': {
      height: '100%',
      '& .MuiListItemButton-root': {
        padding: '0 2px 0 16px',
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
      marginRight: '5px',
    },
    '& .MuiListItemText-root': {
      '> span': {
        fontSize: theme.palette.geoViewFontSize.default,
      },
      '> p': {
        fontSize: theme.palette.geoViewFontSize.sm,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        color: `${theme.palette.geoViewColor.textColor.main} !important`,
        fontWeight: '400 !important',
      },
    },
  },
  listSubitem: {
    padding: '0px',
    marginLeft: '20px',
    width: 'unset',
    boxSizing: 'border-box',
    '& .layerItemContainer': {
      backgroundColor: 'transparent',
      marginBottom: '0px',
    },
  },
});
