import type { SxStyles } from 'geoview-core/ui/style/types';

/**
 * Gets the style classes for the filter panel.
 *
 * @param theme - The MUI theme object
 * @returns The SxStyles object containing style definitions
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSxClasses = (theme: any): SxStyles => ({
  filterPanel: {
    padding: '3px',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    bgcolor: 'background.paper',
  },

  filterPanelButtonContainer: {
    display: 'flex',
    gap: 1,
    p: 2,
    borderTop: 1,
    borderColor: 'divider',
    bgcolor: 'background.default',
  },

  filterHeader: {
    padding: '3px',
    borderBottom: 1,
    borderColor: 'divider',
    bgcolor: 'background.default',
    paddingLeft: '3px',
  },

  filterTitle: {
    fontSize: theme.palette.geoViewFontSize?.lg || '1.125rem',
    fontWeight: 600,
  },

  // Layer section container
  filterLayerSection: {
    m: 1.5,
    padding: '3px 6px 0px',
    border: 1,
    borderColor: 'divider',
    borderRadius: 1,
    overflow: 'hidden',
  },

  // Layer section header
  filterLayerHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    p: 1.5,
    bgcolor: 'background.default',
    gap: 1,
  },

  filterLayerHeaderRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
  },

  // Layer section header (collapsed state - no bottom border)
  filterLayerHeaderCollapsed: {
    borderBottom: 0,
  },

  // Layer section header (expanded state - with bottom border)
  filterLayerHeaderExpanded: {
    borderBottom: 1,
    borderColor: 'divider',
  },

  // Toggle icon button
  filterLayerToggleIcon: {
    transform: 'rotate(0deg)',
    transition: 'transform 0.2s',
    flexShrink: 0,
  },

  // Toggle icon button (collapsed state)
  filterLayerToggleIconCollapsed: {
    transform: 'rotate(-90deg)',
  },

  // Layer name text
  filterLayerName: {
    fontWeight: 500,
    flex: 1,
    minWidth: 0,
  },

  // Clear button
  filterLayerClearButton: {
    minWidth: 'auto',
    whiteSpace: 'nowrap',
  },

  // Layer content area
  filterLayerContent: {
    flex: 1,
    overflowY: 'auto',
    p: 2,
  },

  // Loading state container
  filterLayerLoading: {
    textAlign: 'center',
    py: 2,
  },

  // Loading text
  filterLayerLoadingText: {
    color: 'text.secondary',
  },
});
