import { Theme } from '@mui/material/styles';

// ? I doubt we want to define an explicit type for style properties?
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSxClasses = (theme: Theme): any => ({
  tooltipItem: {
    color: theme.palette.geoViewColor.bgColor.light[900],
    background: theme.palette.geoViewColor.bgColor.dark[900],
    opacity: 0.9,
    fontSize: theme.palette.geoViewFontSize.default,
    padding: '3px 8px',
    borderRadius: '5px',
    textAlign: 'center',
    maxWidth: '350px',
    maxHeight: '60px',
    position: 'absolute',
    display: 'flex',
    top: '-5px',
    left: '3px',
  },
  tooltipText: {
    fontSize: theme.palette.geoViewFontSize.default,
    color: theme.palette.geoViewColor.bgColor.light[900],
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    padding: '5px',
  },
});
