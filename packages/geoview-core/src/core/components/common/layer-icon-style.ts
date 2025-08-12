import { Theme } from '@mui/material/styles';
import { SxStyles } from '@/ui/style/types';

/**
 * Get custom sx classes for the common layer icon
 *
 * @param {Theme} theme the theme object
 * @returns {Object} the sx classes object
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  legendIconTransparent: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
    height: 24,
  },
  iconPreviewHoverable: {
    width: 24,
    height: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    left: -3,
    top: -3,
    padding: 0,
    borderRadius: 0,
    boxShadow: 2,
    transition: 'transform .3s ease-in-out',
    '&:hover': {
      transform: 'rotate(-18deg) translateX(-8px)',
    },
  },
  iconPreviewStacked: {
    width: 24,
    height: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    borderRadius: 0,
    border: '1px solid',
    borderColor: theme.palette.geoViewColor.bgColor.dark[600],
    boxShadow: 2,
    backgroundColor: theme.palette.geoViewColor.white,
  },
  maxIconImg: {
    maxWidth: 24,
    maxHeight: 24,
    padding: 1,
    height: 'auto !important', // Make sure the WMS image is not duplicated to fill the 100% height from parent
  },
  legendIcon: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
    height: '24px !important',
    backgroundColor: theme.palette.geoViewColor.white,
    border: '1px solid',
    borderColor: theme.palette.geoViewColor.bgColor.dark[600],
    borderRadius: 0.5,
  },
  stackIconsBox: {
    width: 24,
    height: 24,
    position: 'relative',
    '&:focus': {
      outlineColor: theme.palette.geoViewColor.bgColor.dark[600],
    },
  },
  iconPreview: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    borderRadius: 0,
    boxShadow: 2,
    '&:focus': {
      border: 'revert',
    },
  },
});
