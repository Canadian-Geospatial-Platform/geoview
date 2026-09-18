import type { Theme } from '@mui/material/styles';

type SxClasses = Record<string, object>;

/**
 * Gets custom sx classes for the layer left panel.
 *
 * @param theme - The theme object
 * @returns The sx classes object
 */
export const getSxClasses = (theme: Theme): SxClasses => ({
  list: {
    color: 'text.primary',
    width: '100%',
    overflowY: 'auto',

    // list item
    '& .MuiListItem-root': {
      height: '100%',
      flexDirection: 'column',
      alignItems: 'stretch',
      '& > .MuiBox-root': {
        height: '100%',
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderBottom: `1px solid ${theme.palette.geoViewColor?.grey.darken(1, 0.12)}`,
      },
    },

    // TODO: WCAG Issue #3236 -  Overly complex. Consider using a CSS class name to identify the deepest nested list items
    // list item boxes - remove border from sub-level list box if the list does not contain sub-items
    '& > .MuiListItem-root:has(ul) ul:not(:has(ul)):last-of-type > li:last-child > .MuiBox-root': {
      borderBottom: 'none',
    },

    // list item button
    '& .MuiListItemButton-root': {
      padding: theme.spacing(0, 0.25, 0, 2),
      height: '100%',
      '&:hover': {
        backgroundColor: 'transparent',
      },
      '&.Mui-selected:not(.Mui-focusVisible)': {
        backgroundColor: 'transparent',
      },
    },

    // layer title
    '& .MuiListItemText-primary': {
      fontWeight: '600',
      fontSize: `${theme.palette.geoViewFontSize?.default} !important`,
    },

    '& .layer-panel': {
      // styling right icons
      '& .rightIcons-container': {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'right',
        alignItems: 'center',
        paddingRight: theme.spacing(0.75),

        '& .MuiIconButton-root': {
          margin: theme.spacing(0, 0.125),
        },
      },
    },

    '& .MuiListItemIcon-root': {
      minWidth: '2.5rem',
      marginRight: theme.spacing(0.75),
    },
    '& .MuiListItemText-root': {
      '> span': {
        fontSize: theme.palette.geoViewFontSize?.default,
      },
      '> p': {
        fontSize: theme.palette.geoViewFontSize?.sm,
        color: `${theme.palette.geoViewColor?.textColor.main} !important`,
        fontWeight: '400 !important',
      },
    },
  },
  listSubitem: {
    padding: theme.spacing(0),
    marginLeft: theme.spacing(2.5),
    width: 'unset',
    boxSizing: 'border-box',
    '& .layerItemContainer': {
      backgroundColor: 'transparent',
      marginBottom: theme.spacing(0),
    },
  },
});
