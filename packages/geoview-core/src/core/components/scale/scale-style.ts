import { Theme } from '@mui/material/styles';

// ? I doubt we want to define an explicit type for style properties?
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSxClasses = (theme: Theme): any => ({
  scaleControl: {
    display: 'none',
  },
  scaleContainer: {
    display: 'flex',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    border: 'none',
    height: '100%',
    ':hover': {
      backgroundColor: 'transparent',
      color: theme.palette.geoViewColor.white,
    },
    '&.interaction-static': {
      padding: '5px',
      backdropFilter: 'blur(5px)',
    },
  },
  scaleExpandedContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    height: '100%',
    gap: theme.spacing(5),
  },
  scaleExpandedCheckmarkText: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '18px',
    maxHeight: '18px',
  },
  scaleTextContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',

    '&.interaction-static': {
      fontSize: theme.palette.geoViewFontSize.md,
      fontWeight: 'bold',
      borderBottom: '2px solid',
    },
    '& span': {
      fontSize: theme.palette.geoViewFontSize.default,
      color: theme.palette.geoViewColor.bgColor.light[800],
      textTransform: 'lowercase',
      whiteSpace: 'nowrap',
    },
  },
  scaleLine: {
    width: '100%',
    height: '3px',
    borderColor: `${theme.palette.geoViewColor.primary.light[800]} !important`,
    backgroundColor: 'transparent',
    position: 'relative',
    borderLeft: '1px solid',
    borderRight: '1px solid',
    borderBottom: '1px solid',
    borderTop: 'none',
  },
  scaleCheckmark: {
    paddingRight: 5,
    color: theme.palette.geoViewColor.bgColor.light[800],
  },
});
