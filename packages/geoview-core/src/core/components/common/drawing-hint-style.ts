import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';

/**
 * Gets the custom styles for the map drawing hint.
 *
 * @param theme - The theme object
 * @returns The styles for the map drawing hint
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  drawingHint: {
    position: 'absolute',
    top: theme.spacing(7),
    left: '50%',
    transform: 'translateX(-50%)',
    maxWidth: 'calc(100% - 32px)',
    width: 'max-content',
    padding: `${theme.spacing(0.75)} ${theme.spacing(1.5)}`,
    color: theme.palette.text.primary,
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadiusMd,
    boxShadow: theme.shadows[4],
    textAlign: 'center',
    overflowWrap: 'anywhere',
    pointerEvents: 'none',
    zIndex: theme.zIndex.olControl + 1,
  },
});
