import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';

/**
 * Get custom sx classes for the layer settings components
 *
 * @param {Theme} theme the theme object
 * @returns {Object} the sx classes object
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  layerSettingsMenu: {
    '& .MuiMenuItem-root': {
      borderRadius: 1,
      margin: '4px 8px',
    },
  },

  // Shared styles for setting selector submenus (raster function, WMS style, etc.)
  settingSelectorMenu: {
    '& .MuiPaper-root': {
      padding: '8px',
      maxHeight: '400px',
      paddingRight: '16px',
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
      // Firefox scrollbar
      scrollbarWidth: 'thin',
      scrollbarColor: `${theme.palette.action.disabled} transparent`,
    },
  },

  settingSelectorMenuItem: {
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 2,
    margin: '4px 0',
    padding: '12px',
    '&:hover': {
      borderColor: 'primary.main',
    },
    '&.Mui-selected': {
      borderColor: 'primary.main',
    },
  },

  settingSelectorListItemText: {
    '& .MuiListItemText-primary': {
      fontWeight: 600,
    },
  },

  settingSelectorPreviewIcon: {
    width: 100,
    height: 100,
  },

  // ESRI Image Raster Function specific styles
  rasterFunctionPreviewImageContainer: {
    width: 100,
    height: 100,
    border: '2px solid',
    borderColor: 'divider',
    borderRadius: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: '16px',
  },

  rasterFunctionPreviewImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },

  // WMS Style specific styles
  wmsStyleMenuItem: {
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 2,
    margin: '4px 0',
    padding: '12px',
    alignItems: 'center',
    '&:hover': {
      borderColor: 'primary.main',
    },
    '&.Mui-selected': {
      borderColor: 'primary.main',
    },
  },

  wmsStylePreviewImageContainer: {
    width: 100,
    minHeight: 100,
    maxHeight: 200, // Cap maximum height to handle tall legend images
    border: '2px solid',
    borderColor: 'divider',
    borderRadius: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: '16px',
  },

  wmsStylePreviewImage: {
    width: '100%',
    height: 'auto', // Preserve aspect ratio
    maxHeight: '200px',
    objectFit: 'contain', // Show full image without cropping
  },
});
