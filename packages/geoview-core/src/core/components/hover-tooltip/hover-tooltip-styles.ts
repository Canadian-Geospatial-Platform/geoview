import type { Theme } from '@mui/material/styles';

/** Record of sx class name to style object. */
type SxClasses = Record<string, object>;

/**
 * Gets custom sx classes for the hover tooltip.
 *
 * @param theme - The theme object
 * @returns The sx classes object
 */
export const getSxClasses = (theme: Theme): SxClasses => ({
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
    pointerEvents: 'none',
    display: 'flex',
    top: '-5px',
    left: '3px',
    zIndex: 250,
    '& .MuiSvgIcon-root': {
      color: theme.palette.geoViewColor.textColor.main,
    },
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
