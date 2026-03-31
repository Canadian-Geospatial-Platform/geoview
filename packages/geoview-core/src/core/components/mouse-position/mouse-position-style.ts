import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';

/**
 * Gets custom sx classes for the mouse position.
 *
 * @param theme - The theme object
 * @returns The sx classes object
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
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
    color: theme.palette.geoViewColor.bgColor.dark[650],
    lineHeight: 1.5,
    ':hover': {
      backgroundColor: 'transparent !important',
      color: theme.palette.geoViewColor.bgColor.dark[750],
    },
  },
  mousePositionTextContainer: {
    color: theme.palette.geoViewColor.bgColor.dark[650],
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
