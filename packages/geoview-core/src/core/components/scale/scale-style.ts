import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
  scaleControl: {
    display: 'none',
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
    color: theme.palette.primary.light,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    border: '1px solid',
    borderColor: theme.palette.primary.light,
    borderTop: 'none',
    borderLeft: 'none',
    borderRight: 'none',
  },
  scaleCheckmark: {
    paddingRight: 5,
    color: theme.palette.primary.light,
  },
});
