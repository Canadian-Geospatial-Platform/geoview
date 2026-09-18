import type { Theme, SxStyles } from 'geoview-core/ui/style/types';

/**
 * Returns the sx style classes for the Custom Legend components.
 *
 * @param theme - The MUI theme object
 * @returns The sx style classes
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  // Main container styles
  container: {
    padding: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflowY: 'auto',
    overflowX: 'hidden',
    background: theme.palette.geoViewColor?.bgColor.main,
  },

  // List container for legend items
  legendList: {
    paddingRight: theme.spacing(1.25),
  },

  // Individual legend list item
  legendListItem: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    '& .MuiCollapse-vertical': {
      marginLeft: theme.spacing(0.75),
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
    padding: theme.spacing(1, 0.5),
  },

  // Header text styling
  headerText: {
    fontSize: theme.palette.geoViewFontSize?.md,
    fontWeight: '600',
    color: theme.palette.geoViewColor?.textColor.main,
    maxWidth: '400px',
  },

  // Group children container
  groupChildren: {
    paddingLeft: theme.spacing(2),
    marginTop: theme.spacing(0),
    width: '100%',
  },

  // Group title styling
  groupTitle: {
    textWrapMode: 'wrap',
    fontSize: '1.125rem', // 18px
    fontWeight: '700',
    lineHeight: 1.2,
    color: theme.palette.geoViewColor?.textColor.main,
  },

  // Group item button
  groupItemButton: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0.75, 0.5),
    width: '100%',
  },

  // Group icon styling
  groupIcon: {
    border: '1px solid #515BA5',
    backgroundColor: theme.palette.geoViewColor?.bgColor.light[800],
    padding: theme.spacing(0.25),
    width: '24px',
    height: '24px',
    transform: 'scaleX(-1)', // Mirror to face right
    borderRadius: '5px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  groupItemContent: {
    margin: theme.spacing(0.75, 0.75, 0.75, 1.5),
    display: 'flex',
    flexDirection: 'column',
    flex: '1 1 auto',
  },

  // Sublayer count caption
  groupSubLayerCount: {
    display: 'block',
    color: '#393939',
    fontSize: '14px',
    margin: theme.spacing(0),
  },

  // Group button row with smaller icons
  groupButtonRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
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
    gap: theme.spacing(0.5),
  },

  descriptionToggleButton: {
    padding: theme.spacing(0, 0.25, 0, 0),
    minWidth: 'auto',
    fontSize: '0.75rem',
    fontStyle: 'italic',
    fontWeight: 300,
    textTransform: 'none',
    color: theme.palette.geoViewColor?.textColor.dark[200],
    '&:hover': {
      backgroundColor: 'transparent',
    },
    '&:focus-visible': {
      border: 'none !important',
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
    marginTop: theme.spacing(0.5),
    marginLeft: theme.spacing(2),
  },

  // Reset margins for description text (important for group descriptions)
  descriptionCollapse: {
    marginLeft: `${theme.spacing(0)} !important`,
    '& .MuiCollapse-vertical': {
      marginLeft: `${theme.spacing(0)} !important`,
    },
  },
});
