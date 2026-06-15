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
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: theme.palette.geoViewColor?.bgColor.main,
    color: theme.palette.geoViewColor?.textColor.main,
  },

  filterHeader: {
    padding: '16px',
    borderBottom: `1px solid ${theme.palette.geoViewColor?.primary.dark?.[200]}`,
    backgroundColor: theme.palette.geoViewColor?.bgColor.light?.[200],
  },

  filterTitle: {
    margin: 0,
    fontSize: theme.palette.geoViewFontSize?.lg,
    fontWeight: 600,
    color: theme.palette.geoViewColor?.textColor.main,
  },

  filterContent: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px',
    backgroundColor: theme.palette.geoViewColor?.bgColor.main,
  },

  filterLayerSection: {
    marginBottom: '12px',
    border: `1px solid ${theme.palette.geoViewColor?.primary.dark?.[200]}`,
    borderRadius: '4px',
    backgroundColor: theme.palette.geoViewColor?.bgColor.main,
  },

  filterLayerHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px',
    backgroundColor: theme.palette.geoViewColor?.bgColor.light?.[200],
    borderBottom: `1px solid ${theme.palette.geoViewColor?.primary.dark?.[200]}`,
  },

  filterLayerContent: {
    padding: '12px',
    backgroundColor: theme.palette.geoViewColor?.bgColor.main,
  },

  filterLayerToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    fontSize: theme.palette.geoViewFontSize?.default,
    fontWeight: 500,
    color: theme.palette.geoViewColor?.textColor.main,
    flex: 1,
    textAlign: 'left',
    '&:hover': {
      color: theme.palette.geoViewColor?.primary.main,
    },
  },

  filterToggleIcon: {
    fontSize: '10px',
    color: theme.palette.geoViewColor?.textColor.light?.[200],
    transition: 'transform 0.2s ease',
  },

  filterToggleIconCollapsed: {
    transform: 'rotate(-90deg)',
  },

  filterToggleIconExpanded: {
    transform: 'rotate(0deg)',
  },

  filterLayerName: {
    fontWeight: 500,
    color: theme.palette.geoViewColor?.textColor.main,
  },

  filterClearButton: {
    background: 'none',
    border: `1px solid ${theme.palette.geoViewColor?.primary.dark?.[200]}`,
    borderRadius: '3px',
    padding: '4px 12px',
    fontSize: theme.palette.geoViewFontSize?.sm,
    color: theme.palette.geoViewColor?.primary.main,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: theme.palette.geoViewColor?.bgColor.light?.[100],
      borderColor: theme.palette.geoViewColor?.primary.main,
    },
    '&:active': {
      backgroundColor: theme.palette.geoViewColor?.bgColor.light?.[200],
    },
  },

  filterControl: {
    marginBottom: '16px',
    '&:last-child': {
      marginBottom: 0,
    },
  },

  filterLabel: {
    display: 'block',
    marginBottom: '6px',
    fontSize: theme.palette.geoViewFontSize?.sm,
    fontWeight: 500,
    color: theme.palette.geoViewColor?.textColor.main,
  },

  filterSelect: {
    width: '100%',
    padding: '8px 12px',
    border: `1px solid ${theme.palette.geoViewColor?.primary.dark?.[200]}`,
    borderRadius: '3px',
    fontSize: theme.palette.geoViewFontSize?.default,
    color: theme.palette.geoViewColor?.textColor.main,
    backgroundColor: theme.palette.geoViewColor?.bgColor.main,
    cursor: 'pointer',
    transition: 'border-color 0.2s ease',
    '&:hover': {
      borderColor: theme.palette.geoViewColor?.primary.main,
    },
    '&:focus': {
      outline: 'none',
      borderColor: theme.palette.geoViewColor?.primary.main,
      boxShadow: `0 0 0 2px ${theme.palette.geoViewColor?.primary.light?.[100]}`,
    },
    '&:disabled': {
      backgroundColor: theme.palette.geoViewColor?.bgColor.dark?.[100],
      cursor: 'not-allowed',
      opacity: 0.6,
    },
  },

  filterInput: {
    width: '100%',
    padding: '8px 12px',
    border: `1px solid ${theme.palette.geoViewColor?.primary.dark?.[200]}`,
    borderRadius: '3px',
    fontSize: theme.palette.geoViewFontSize?.default,
    color: theme.palette.geoViewColor?.textColor.main,
    backgroundColor: theme.palette.geoViewColor?.bgColor.main,
    transition: 'border-color 0.2s ease',
    '&:hover': {
      borderColor: theme.palette.geoViewColor?.primary.main,
    },
    '&:focus': {
      outline: 'none',
      borderColor: theme.palette.geoViewColor?.primary.main,
      boxShadow: `0 0 0 2px ${theme.palette.geoViewColor?.primary.light?.[100]}`,
    },
  },

  filterInputSmall: {
    width: 'auto',
    flex: 1,
  },

  filterRange: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },

  filterRangeSeparator: {
    color: theme.palette.geoViewColor?.textColor.light?.[200],
    fontSize: theme.palette.geoViewFontSize?.sm,
  },

  filterMultiselect: {
    border: `1px solid ${theme.palette.geoViewColor?.primary.dark?.[200]}`,
    borderRadius: '3px',
    backgroundColor: theme.palette.geoViewColor?.bgColor.main,
    maxHeight: '200px',
    overflowY: 'auto',
  },

  filterCheckboxList: {
    padding: '4px',
  },

  filterCheckboxItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 8px',
    cursor: 'pointer',
    borderRadius: '3px',
    transition: 'background 0.15s ease',
    '&:hover': {
      backgroundColor: theme.palette.geoViewColor?.bgColor.light?.[100],
    },
  },

  filterCheckboxInput: {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
    accentColor: theme.palette.geoViewColor?.primary.main,
  },

  filterCheckboxLabel: {
    flex: 1,
    fontSize: theme.palette.geoViewFontSize?.sm,
    color: theme.palette.geoViewColor?.textColor.main,
    userSelect: 'none',
  },

  filterLoading: {
    padding: '20px',
    textAlign: 'center',
    color: theme.palette.geoViewColor?.textColor.light?.[200],
    fontSize: theme.palette.geoViewFontSize?.sm,
  },

  filterEmpty: {
    padding: '12px',
    textAlign: 'center',
    color: theme.palette.geoViewColor?.textColor.light?.[200],
    fontSize: theme.palette.geoViewFontSize?.sm,
    fontStyle: 'italic',
  },

  filterError: {
    padding: '20px',
    textAlign: 'center',
    color: '#d83020',
    fontSize: theme.palette.geoViewFontSize?.default,
    backgroundColor: '#fef4f4',
    border: '1px solid #f3c6c1',
    borderRadius: '4px',
    margin: '16px',
  },

  filterActions: {
    display: 'flex',
    gap: '8px',
    padding: '16px',
    borderTop: `1px solid ${theme.palette.geoViewColor?.primary.dark?.[200]}`,
    backgroundColor: theme.palette.geoViewColor?.bgColor.light?.[200],
  },

  filterButton: {
    flex: 1,
    padding: '10px 16px',
    border: 'none',
    borderRadius: '3px',
    fontSize: theme.palette.geoViewFontSize?.default,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },

  filterButtonPrimary: {
    backgroundColor: theme.palette.geoViewColor?.primary.main,
    color: theme.palette.geoViewColor?.white,
    '&:hover': {
      backgroundColor: theme.palette.geoViewColor?.primary.dark?.[100],
    },
    '&:active': {
      backgroundColor: theme.palette.geoViewColor?.primary.dark?.[200],
    },
    '&:disabled': {
      backgroundColor: theme.palette.geoViewColor?.bgColor.dark?.[100],
      color: theme.palette.geoViewColor?.textColor.light?.[200],
      cursor: 'not-allowed',
    },
  },

  filterButtonSecondary: {
    backgroundColor: theme.palette.geoViewColor?.bgColor.main,
    color: theme.palette.geoViewColor?.primary.main,
    border: `1px solid ${theme.palette.geoViewColor?.primary.main}`,
    '&:hover': {
      backgroundColor: theme.palette.geoViewColor?.bgColor.light?.[100],
    },
    '&:active': {
      backgroundColor: theme.palette.geoViewColor?.bgColor.light?.[200],
    },
    '&:disabled': {
      backgroundColor: theme.palette.geoViewColor?.bgColor.main,
      color: theme.palette.geoViewColor?.textColor.light?.[200],
      borderColor: theme.palette.geoViewColor?.primary.dark?.[200],
      cursor: 'not-allowed',
    },
  },
});
