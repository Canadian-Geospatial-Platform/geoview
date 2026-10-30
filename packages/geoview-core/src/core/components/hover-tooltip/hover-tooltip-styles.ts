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
    color: theme.palette.inverseContent?.text ?? theme.palette.common.white,
    background: theme.palette.inverseContent?.surface ?? theme.palette.grey[900],
    opacity: 0.9,
    fontSize: theme.typography.body1.fontSize,
    padding: theme.spacing(0.5, 1),
    borderRadius: theme.shape.borderRadiusMd,
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
      color: theme.palette.text.primary,
    },
  },
  tooltipText: {
    fontSize: theme.typography.body1.fontSize,
    color: theme.palette.inverseContent?.text ?? theme.palette.common.white,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    padding: theme.spacing(0.5),
  },
});
