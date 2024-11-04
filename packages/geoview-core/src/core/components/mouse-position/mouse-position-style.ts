import { Theme } from '@mui/material/styles';

// ? I doubt we want to define an explicit type for style properties?
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSxClasses = (theme: Theme): any => ({
  mousePosition: {
    display: 'flex',
    minWidth: 'fit-content',
    paddingRight: '1rem',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    alignItems: 'center',
    width: 'auto',
    backgroundColor: 'transparent !important',
    height: 'inherit !important',
    color: theme.palette.geoViewColor.bgColor.light[800],
    lineHeight: 1.5,
    ':hover': {
      backgroundColor: 'transparent !important',
      color: theme.palette.geoViewColor.bgColor.light[600],
    },
  },
  mousePositionTextContainer: {
    display: 'flex',
    flexDirection: 'column',
    [theme.breakpoints.down('md')]: {
      display: 'none',
    },
  },
  mousePositionTextCheckmarkContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    '& span': {
      fontSize: theme.palette.geoViewFontSize.default,
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
    },
  },
  mousePositionCheckmark: {
    paddingRight: 5,
  },
  mousePositionText: {
    fontSize: theme.palette.geoViewFontSize.default,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  },
});
