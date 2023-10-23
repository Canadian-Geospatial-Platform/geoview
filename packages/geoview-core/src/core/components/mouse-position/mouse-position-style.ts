import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
  mousePositionTooltip: {
    '> button': {
      display: 'flex',
      padding: theme.spacing(0, 4),
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      alignItems: 'center',
      border: 'none',
      backgroundColor: 'transparent',
    },
  },
  mousePositionTextContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  mousePositionTextCheckmarkContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    '& span': {
      fontSize: theme.typography.fontSize,
      color: theme.palette.primary.light,
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
    },
  },
  mousePositionCheckmark: {
    paddingRight: 5,
    color: theme.palette.primary.light,
  },
  mousePositionText: {
    fontSize: theme.typography.fontSize,
    color: theme.palette.primary.light,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  },
});
