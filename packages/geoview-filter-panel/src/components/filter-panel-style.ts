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
    padding: '16px',
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
    mb: 5,
    '&:last-child': {
      mb: 0,
    },
    padding: '3px 6px 0px',
    border: 1,
    borderColor: theme.palette.geoViewColor?.bgColor?.dark?.[100] || 'divider',
    borderRadius: 1,
    overflow: 'hidden',
  },

  // Layer section header
  filterLayerHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    p: 1.5,
    bgcolor: 'background.default',
  },

  filterLayerHeaderTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 1,
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
    overflowWrap: 'break-word',
    wordBreak: 'normal',
    hyphens: 'auto',
  },

  // Clear button
  filterLayerClearButton: {
    minWidth: 'auto',
    whiteSpace: 'nowrap',
    alignSelf: 'flex-start',
    marginBottom: 5,
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
