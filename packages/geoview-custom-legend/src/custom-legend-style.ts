import type { SxStyles } from 'geoview-core/ui/style/types';

/**
 * Returns the sx style classes for the Custom Legend components.
 *
 * @param theme - The MUI theme object
 * @returns The sx style classes
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSxClasses = (theme: any): SxStyles => ({
  // Main container styles
  container: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflowY: 'auto',
    overflowX: 'hidden',
    background: theme.palette.geoViewColor?.bgColor.main,
  },

  // List container for legend items
  legendList: {
    paddingRight: '0.65rem',
  },

  // Individual legend list item
  legendListItem: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    '& .MuiCollapse-vertical': {
      marginLeft: '6px',
    },
    '& .MuiListItemButton-root:hover': {
      backgroundColor: 'transparent',
    },
  },

  // Used by HeaderItem component
  headerItem: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    borderBottom: `1px solid ${theme.palette.geoViewColor?.grey.light[800]}`,
    padding: '8px 4px',
  },

  // Header text styling
  headerText: {
    fontSize: theme.palette.geoViewFontSize.md,
    fontWeight: '600',
    color: theme.palette.geoViewColor?.textColor.main,
    maxWidth: '400px',
  },

  // Group children container
  groupChildren: {
    paddingLeft: '16px',
    marginTop: 0,
    width: '100%',
  },

  // Group title styling
  groupTitle: {
    textWrapMode: 'wrap',
    fontSize: '1.125rem', // 18px
    fontWeight: '700',
    lineHeight: 1.2,
    textOverflow: 'ellipsis',
    color: theme.palette.geoViewColor?.textColor.main,
  },

  // Group item button
  groupItemButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 4px',
    width: '100%',
  },

  // Group icon styling
  groupIcon: {
    border: '1px solid #515BA5',
    backgroundColor: theme.palette.geoViewColor?.bgColor.light[800],
    padding: '2px',
    width: '24px',
    height: '24px',
    transform: 'scaleX(-1)', // Mirror to face right
    borderRadius: '5px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  groupItemContent: {
    margin: '6px 6px 6px 12px',
    display: 'flex',
    flexDirection: 'column',
    flex: '1 1 auto',
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
    '& .MuiSvgIcon-root': {
      fontSize: '1.25rem',
    },
  },

  // Collapse button container
  groupCollapseButton: {
    display: 'flex',
    alignItems: 'center',
  },

  descriptionContainer: {
    display: 'flex',
    flexDirection: 'row',
  },

  descriptionToggleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },

  descriptionToggleButton: {
    padding: '0 2px 0 0',
    minWidth: 'auto',
    fontSize: '0.75rem',
    fontStyle: 'italic',
    fontWeight: 300,
    textTransform: 'none',
    color: theme.palette.geoViewColor?.textColor.dark[200],
    '&:hover': {
      backgroundColor: 'transparent',
    },
    '&.keyboard-focused': {
      border: 'none !important',
    },
    '&:focus-visible': {
      outline: '2px solid',
      color: theme.palette.geoViewColor?.textColor.dark[200],
      outlineOffset: '2px',
    },
  },

  descriptionText: {
    fontSize: '0.875rem',
    fontStyle: 'italic',
    fontWeight: 300,
    color: theme.palette.geoViewColor?.textColor.dark,
    marginTop: '4px',
    marginLeft: '16px',
  },

  // Reset margins for description text (important for group descriptions)
  descriptionCollapse: {
    marginLeft: '0 !important',
    '& .MuiCollapse-vertical': {
      marginLeft: '0 !important',
    },
  },
});
