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

  // Section container for each settings group (raster function, mosaic rule)
  settingsSection: {
    marginBottom: '24px',
    border: '1px solid',
    borderColor: theme.palette.divider,
    borderRadius: '8px',
    padding: '12px',
    transition: 'border-color 0.2s',
  },

  settingsSectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: theme.palette.geoViewColor.textColor.main,
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'color 0.2s',
    '&:hover': {
      color: theme.palette.primary.main,
    },
    '&:focus-visible': {
      outline: `2px solid ${theme.palette.primary.main}`,
      outlineOffset: '2px',
      borderRadius: '4px',
    },
  },

  settingsSectionTitle: {
    fontWeight: 600,
    fontSize: theme.palette.geoViewFontSize.default,
  },

  // Shared card list styles (used by raster function and WMS style selectors)
  settingsCardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
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
    alignItems: 'center',
    padding: '12px',
    border: '1px solid',
    borderColor: theme.palette.divider,
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'border-color 0.2s, background-color 0.2s',
    '&:hover': {
      borderColor: theme.palette.primary.main,
      backgroundColor: theme.palette.action.hover,
    },
    '&:focus-visible': {
      outline: `2px solid ${theme.palette.primary.main}`,
      outlineOffset: '2px',
    },
  },

  settingsCardSelected: {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.selected,
  },

  // ESRI Image Raster Function specific styles
  rasterFunctionPreviewImageContainer: {
    width: 100,
    height: 100,
    border: '2px solid',
    borderColor: theme.palette.divider,
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: '16px',
    flexShrink: 0,
  },

  rasterFunctionPreviewImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },

  // WMS Style specific styles
  wmsStylePreviewImageContainer: {
    width: 100,
    minHeight: 100,
    maxHeight: 200, // Cap maximum height to handle tall legend images
    border: '2px solid',
    borderColor: theme.palette.divider,
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: '16px',
    flexShrink: 0,
  },

  wmsStylePreviewImage: {
    width: '100%',
    height: 'auto', // Preserve aspect ratio
    maxHeight: '200px',
    objectFit: 'contain', // Show full image without cropping
  },
});
