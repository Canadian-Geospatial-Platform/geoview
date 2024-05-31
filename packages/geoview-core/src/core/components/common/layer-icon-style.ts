import { Theme } from '@mui/material/styles';

// ? I doubt we want to define an explicit type for style properties?
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSxClasses = (theme: Theme): any => ({
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
    boxShadow: 2,
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
    borderColor: theme.palette.geoViewColor.bgColor.dark[600],
    boxShadow: 2,
    backgroundColor: theme.palette.geoViewColor.white,
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
    padding: 0,
    borderRadius: 0,
    boxShadow: 2,
    '&:focus': {
      border: 'revert',
    },
  },
});
