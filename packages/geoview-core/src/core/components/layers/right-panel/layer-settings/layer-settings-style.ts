import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';

/**
 * Get custom sx classes for the layer settings components.
 *
 * @param theme - The MUI theme object.
 * @returns The sx classes object for layer settings panel and sub-components.
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  settingSelectorPreviewIcon: {
    width: 100,
    height: 100,
  },

  settingsSectionContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    borderTop: `1px solid ${theme.palette.divider}`,
    marginTop: theme.spacing(1),
    paddingTop: theme.spacing(2),
  },

  // Section container for each settings group (raster function, mosaic rule)
  settingsSection: {
    border: '1px solid',
    borderColor: theme.palette.divider,
    borderRadius: '8px',
    padding: theme.spacing(1.5),
    transition: 'border-color 0.2s',
  },

  settingsSectionHeader: {
    display: 'flex',
    width: '100%',
    alignItems: 'center',
    gap: theme.spacing(1),
    color: theme.palette.geoViewColor?.textColor.main,
    textAlign: 'left',
    transition: 'color 0.2s',
    '&:hover': {
      color: theme.palette.primary.main,
    },
  },

  settingsSectionTitle: {
    display: 'block',
    fontWeight: 600,
    fontSize: theme.palette.geoViewFontSize?.default,
  },

  settingsSectionHeaderText: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.25),
    flex: 1,
    minWidth: 0,
  },

  settingsSectionSummary: {
    display: 'block',
    fontSize: theme.palette.geoViewFontSize?.sm,
  },

  settingsSectionContentCollapsed: {
    marginTop: theme.spacing(0),
  },

  settingsSectionContentExpanded: {
    marginTop: theme.spacing(1.5),
  },

  settingsSectionContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  },

  settingsAscendingRow: {
    display: 'flex',
    alignItems: 'center',
  },

  settingsAscendingLabel: {
    marginLeft: theme.spacing(0.25),
  },

  // Shared card list styles (used by raster function and WMS style selectors)
  settingsCardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    maxHeight: '400px',
    overflowY: 'auto',
    // Custom scrollbar styling
    '&::-webkit-scrollbar': {
      width: '8px',
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent',
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: theme.palette.action.disabled,
      borderRadius: '4px',
      '&:hover': {
        backgroundColor: theme.palette.action.hover,
      },
    },
    scrollbarWidth: 'thin',
    scrollbarColor: `${theme.palette.action.disabled} transparent`,
  },

  settingsCard: {
    display: 'flex',
    gap: theme.spacing(2),
    alignSelf: 'stretch',
    alignItems: 'center',
    flexShrink: 0,
    textAlign: 'left',
    margin: theme.spacing(0.5),
    padding: theme.spacing(1.5),
    border: '1px solid',
    borderColor: theme.palette.divider,
    borderRadius: '8px',
    transition: 'border-color 0.2s, background-color 0.2s',
    '&:hover': {
      borderColor: theme.palette.primary.main,
      backgroundColor: theme.palette.action.hover,
    },
    '&:focus-visible': {
      outlineOffset: 0,
      boxShadow: 'none',
    },
  },

  settingsCardSelected: {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.selected,
  },

  settingsCardText: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
  },

  settingsCardTitle: {
    display: 'block',
    fontWeight: 600,
  },

  settingsCardDescription: {
    display: 'block',
  },

  previewImageContainer: {
    width: 100,
    border: '2px solid',
    borderColor: theme.palette.divider,
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },

  previewImage: {
    width: '100%',
  },

  // ESRI Image Raster Function specific styles
  rasterFunctionPreviewImageContainer: {
    height: 100,
  },

  rasterFunctionPreviewImage: {
    height: '100%',
    objectFit: 'cover',
  },

  // WMS Style specific styles
  wmsStylePreviewImageContainer: {
    minHeight: 100,
    maxHeight: 200,
  },
  wmsStylePreviewImage: {
    height: 'auto', // Preserve aspect ratio
    maxHeight: '200px',
    objectFit: 'contain', // Show full image without cropping
  },
});
