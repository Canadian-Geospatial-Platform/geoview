type SxClasses = Record<string, object>;

/**
 * Get custom sx classes for the legend
 *
 * @param {any} theme the theme object
 * @returns {Object} the sx classes object
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSxClasses = (theme: any): SxClasses => ({
  // Main container styles
  container: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100% - 47px)',
    overflowY: 'auto',
    overflowX: 'hidden',
    background: theme.palette.geoViewColor.bgColor.main,
  },

  // List container for legend items
  legendList: {
    paddingRight: '0.65rem',
  },

  // Individual legend list item
  legendListItem: {
    padding: '6px 4px',
    flexDirection: 'column',
    alignItems: 'flex-start',
    '& .MuiCollapse-vertical': {
      marginLeft: '6px',
    },
  },

  // Used by HeaderItem component
  headerItem: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    borderBottom: `1px solid ${theme.palette.geoViewColor.grey.light[800]}`,
    padding: '8px 4px',
  },

  // Header text styling
  headerText: {
    fontSize: theme.palette.geoViewFontSize.md,
    fontWeight: '600',
    color: theme.palette.geoViewColor.textColor.main,
  },

  // Group children container
  groupChildren: {
    paddingLeft: '16px',
    marginTop: 0,
    width: '100%',
    '& .MuiCollapse-vertical': {
      marginLeft: '6px',
    },
  },

  // Group title styling
  groupTitle: {
    fontSize: '1.125rem', // 18px
    fontWeight: '700',
    lineHeight: 1.2,
    textOverflow: 'ellipsis',
    color: theme.palette.geoViewColor.textColor.main,
  },

  // Group item button
  groupItemButton: {
    padding: '6px 4px',
    width: '100%',
    '&:hover': {
      backgroundColor: theme.palette.geoViewColor.bgColor.light[300],
    },
    cursor: 'default',
    '&.MuiListItemButton-root': {
      paddingLeft: '4px',
      paddingRight: '4px',
    },
  },

  // Group icon styling
  groupIcon: {
    border: '1px solid #515BA5',
    backgroundColor: theme.palette.geoViewColor.bgColor.light[800],
    padding: '2px',
    maxWidth: '1.875rem',
    maxHeight: '1.875rem',
    transform: 'scaleX(-1)', // Mirror to face right
    borderRadius: '5px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Sublayer count caption
  groupSubLayerCount: {
    display: 'block',
    color: '#393939',
    fontSize: '14px',
    margin: '0px',
  },

  // Group button row with smaller icons
  groupButtonRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginTop: '8px',
    '& .MuiSvgIcon-root': {
      fontSize: '1.25rem',
    },
  },

  // Collapse button container
  groupCollapseButton: {
    display: 'flex',
    alignItems: 'center',
  },
});
