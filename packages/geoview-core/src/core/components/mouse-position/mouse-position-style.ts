import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';
import { ellipsisOverflow } from '@/ui/style/default';

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
    ...ellipsisOverflow,
    alignItems: 'center',
    width: 'auto',
    backgroundColor: 'transparent !important',
    height: 'inherit !important',
    color: theme.palette.geoViewColor?.bgColor.dark[650],
    lineHeight: 1.5,
    minHeight: '33px',
    paddingBlock: theme.spacing(0.25),
    ':hover': {
      backgroundColor: 'transparent !important',
      color: theme.palette.geoViewColor?.bgColor.dark[750],
    },
    '&.Mui-focusVisible': {
      outlineOffset: '0',
      boxShadow: 'none',
    },
  },
  mousePositionTextContainer: {
    color: theme.palette.geoViewColor?.bgColor.dark[650],
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
      fontSize: theme.palette.geoViewFontSize?.default,
      ...ellipsisOverflow,
    },
  },
  mousePositionRadioGroup: {
    padding: theme.spacing(0, 1),
    // Show focus ring when any child Radio has focus
    '&:has(:focus-visible)': {
      borderRadius: '4px',
      outline: `3px solid ${
        theme.palette.geoViewColor?.focusIndicator.outline ??
        (theme.palette.mode === 'dark' ? theme.palette.common.white : theme.palette.common.black)
      }`,
      outlineOffset: 0,
    },
  },
  mousePositionRadioHidden: {
    // Hide the radio circle visually but keep it keyboard-accessible
    opacity: 0,
    width: 0,
    height: 0,
    padding: 0,
    margin: 0,
    position: 'absolute',
    top: 0,
    left: 0,
    // Prevent any pointer interaction directly on the Radio
    pointerEvents: 'none',
  },
  mousePositionRadioLabel: {
    margin: 0,
    alignItems: 'center',
    width: '100%',
    cursor: 'pointer',
    justifyContent: 'flex-start',
  },
  mousePositionCheckmark: {
    paddingRight: theme.spacing(0.75),
    fontSize: theme.palette.geoViewFontSize?.lg,
    color: theme.palette.geoViewColor?.bgColor.dark[650],
  },
  mousePositionText: {
    fontSize: theme.palette.geoViewFontSize?.default,
    ...ellipsisOverflow,
  },
});
