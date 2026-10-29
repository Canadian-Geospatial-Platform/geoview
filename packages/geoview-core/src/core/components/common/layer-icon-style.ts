import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';

/**
 * Gets custom sx classes for the common layer icon.
 *
 * @param theme - The MUI theme object
 * @returns The sx classes object
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
    padding: theme.spacing(0),
    borderRadius: theme.shape.borderRadiusNone,
    boxShadow: 2,
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.standard,
      easing: theme.transitions.easing.easeInOut,
    }),
    '&:hover': {
      transform: 'rotate(-18deg) translateX(-8px)',
    },
  },
  // Icon containers use invariant white: layer symbology is authored for a white backing and must not follow the theme surface.
  iconPreviewStacked: {
    width: 24,
    height: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(0),
    borderRadius: theme.shape.borderRadiusNone,
    border: '1px solid',
    borderColor: theme.palette.divider,
    boxShadow: 2,
    backgroundColor: theme.palette.common.white,
  },
  maxIconImg: {
    maxWidth: 24,
    maxHeight: 24,
    padding: theme.spacing(0.25),
    height: 'auto !important', // Make sure the WMS image is not duplicated to fill the 100% height from parent
  },
  legendIcon: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
    height: '24px !important',
    backgroundColor: theme.palette.common.white,
    border: '1px solid',
    borderColor: theme.palette.divider,
    borderRadius: theme.shape.borderRadiusSm,
  },
  titleIcon: {
    '&.MuiSvgIcon-root': {
      border: '1px solid',
      backgroundColor: theme.palette.common.white,
      borderColor: theme.palette.primary.main,
      borderRadius: theme.shape.borderRadiusSm,
      '& path': {
        fill: theme.palette.geoViewColor?.bgColor.dark[800],
      },
    },
  },
  iconBox: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '30px',
    height: '30px',
    backgroundColor: theme.palette.common.white,
    border: '1px solid',
    borderColor: theme.palette.primary.main,
    borderRadius: theme.shape.borderRadiusSm,
  },
  groupIcon: {
    transform: 'scaleX(-1)',
  },
  stackIconsBox: {
    width: 24,
    height: 24,
    position: 'relative',
    '&:focus': {
      outlineColor: theme.palette.geoViewColor?.bgColor.dark[600],
    },
  },
  iconPreview: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing(0),
    borderRadius: theme.shape.borderRadiusNone,
    boxShadow: 2,
    '&:focus': {
      border: 'revert',
    },
  },
  loadingBox: {
    padding: theme.spacing(0.5),
    marginRight: theme.spacing(1.25),
  },
});
