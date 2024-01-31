import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
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
    position: 'absolute',
    left: -3,
    top: -2,
    padding: 0,
    borderRadius: 0,
    boxShadow: theme?.footerPanel.boxShadow,
    transition: 'transform .3s ease-in-out',
    '&:hover': {
      transform: 'rotate(-18deg) translateX(-8px)',
    },
  },
  iconPreviewStacked: {
    width: 24,
    height: 24,
    padding: 0,
    borderRadius: 0,
    border: '1px solid',
    borderColor: 'geoViewColors.bgColor.dark[600]',
    boxShadow: theme?.footerPanel.boxShadow,
    backgroundColor: 'geoViewColors.white',
  },
  maxIconImg: {
    maxWidth: 24,
    maxHeight: 24,
  },
  legendIcon: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
    height: 24,
    backgroundColor: 'geoViewColors.white',
    border: '1px solid',
    borderColor: 'geoViewColors.bgColor.dark[600]',
  },
  stackIconsBox: {
    width: 24,
    height: 24,
    position: 'relative',
    '&:focus': {
      outlineColor: 'geoViewColors.bgColor.dark[600]',
    },
  },
  iconPreview: {
    padding: 0,
    borderRadius: 0,
    boxShadow: theme?.footerPanel.boxShadow,
    '&:focus': {
      border: 'revert',
    },
  },
});
