import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
  scaleControl: {
    display: 'none',
  },
  scaleContainer: {
    display: 'flex',
    backgroundColor: 'transparent',
    border: 'none',
    height: '100%',
    ':hover': {
      backgroundColor: 'transparent',
      color: theme.palette.geoViewColors.white,
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
  scaleText: {
    fontSize: theme.typography.fontSize,
    color: theme.palette.geoViewColors.primary.light[300],
    whiteSpace: 'nowrap',
    border: '1px solid',
    borderColor: theme.palette.geoViewColors.primary.light[300],
    borderTop: 'none',
    borderLeft: 'none',
    borderRight: 'none',
    textTransform: 'lowercase',
  },
  scaleCheckmark: {
    paddingRight: 5,
    color: theme.palette.geoViewColors.primary.light[300],
  },
});
