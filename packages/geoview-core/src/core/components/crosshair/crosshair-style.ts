import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
  crosshairContainer: {
    position: 'absolute',
    top: theme.spacing(0),
    right: theme.spacing(0),
    left: theme.spacing(0),
    bottom: theme.spacing(0),
    paddingBottom: theme.spacing(6),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none !important',
    zIndex: theme.zIndex.olControl,
  },
  crosshairInfo: {
    position: 'absolute',
    top: theme.spacing(0),
    right: theme.spacing(0),
    left: theme.spacing(0),
    height: 'calc(1em + 8px)',
    padding: theme.spacing(2, 1, 4, 1),
    backgroundColor: theme.palette.geoViewColor.grey.lighten(0.1, 0.9),
    '& span': {
      paddingLeft: 70,
    },
  },
  crosshairIcon: {
    width: theme.overrides.crosshairIcon.size.width,
    height: theme.overrides.crosshairIcon?.size.height,
  },
});
