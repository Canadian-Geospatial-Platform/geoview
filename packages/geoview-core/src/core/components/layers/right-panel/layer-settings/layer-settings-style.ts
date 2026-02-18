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

  rasterFunctionMenu: {
    '& .MuiPaper-root': {
      padding: '8px',
      maxHeight: '400px',
      paddingRight: '16px', // Extra padding for scrollbar space
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

  rasterFunctionMenuItem: {
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
  previewImageContainer: {
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
  previewImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  previewIcon: {
    width: 100,
    height: 100,
  },

  rasterFunctionListItemText: {
    '& .MuiListItemText-primary': {
      fontWeight: 600,
    },
  },
});
