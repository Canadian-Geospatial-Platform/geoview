import type { Theme, SxStyles } from 'geoview-core/ui/style/types';

/**
 * Gets the style classes for the filter panel.
 *
 * @param theme - The MUI theme object
 * @returns The SxStyles object containing style definitions
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  filterPanel: {
    padding: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    bgcolor: 'background.paper',
  },

  filterPanelButtonContainer: {
    display: 'flex',
    gap: theme.spacing(1),
    padding: theme.spacing(0.25),
    borderTop: 1,
    borderColor: 'divider',
    bgcolor: 'background.default',
  },

  filterHeader: {
    padding: theme.spacing(0.5),
    borderBottom: 1,
    borderColor: 'divider',
    bgcolor: 'background.default',
    paddingLeft: theme.spacing(0.5),
  },

  filterTitle: {
    fontSize: theme.palette.geoViewFontSize?.lg || '1.125rem',
    fontWeight: 600,
  },

  // Layer section container
  filterLayerSection: {
    marginBottom: theme.spacing(0.75),
    '&:last-child': {
      marginBottom: theme.spacing(0),
    },
    padding: theme.spacing(0.5, 0.75, 0),
    border: 1,
    borderColor: theme.palette.geoViewColor?.bgColor?.dark?.[100] || 'divider',
    borderRadius: 1,
    overflow: 'hidden',
  },

  // Layer section header
  filterLayerHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    padding: theme.spacing(1.5),
    bgcolor: 'background.default',
  },

  filterLayerHeaderTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(1),
  },

  // Layer section header (collapsed state - no bottom border)
  filterLayerHeaderCollapsed: {
    borderBottom: 0,
  },

  // Layer section header (expanded state - with bottom border)
  filterLayerHeaderExpanded: {
    borderBottom: 1,
    borderColor: theme.palette.geoViewColor?.bgColor?.dark?.[100] || 'divider',
  },

  // Toggle icon button
  filterLayerToggleIcon: {
    transform: 'rotate(180deg)',
    transition: 'transform 0.2s',
    flexShrink: 0,
  },

  // Toggle icon button (collapsed state)
  filterLayerToggleIconCollapsed: {
    transform: 'rotate(0deg)',
  },

  // Layer name text
  filterLayerName: {
    fontSize: theme.palette.geoViewFontSize?.md || '1rem',
    fontWeight: 600,
    flex: 1,
    minWidth: 0,
  },

  // Clear button
  filterLayerClearButton: {
    minWidth: 'auto',
    whiteSpace: 'nowrap',
    alignSelf: 'flex-start',
    marginBottom: theme.spacing(0.75),
  },

  // Layer content area
  filterLayerContent: {
    flex: 1,
    overflowY: 'auto',
    padding: theme.spacing(0.25),
  },

  // Collapsible content wrapper for a single layer's filter controls
  filterLayerCollapseContent: {
    padding: theme.spacing(0.25),
  },

  // Loading state container
  filterLayerLoading: {
    textAlign: 'center',
    paddingTop: theme.spacing(0.25),
    paddingBottom: theme.spacing(0.25),
  },

  // Loading text
  filterLayerLoadingText: {
    color: 'text.secondary',
  },
});
