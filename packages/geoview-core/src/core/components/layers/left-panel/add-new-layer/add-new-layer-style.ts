import type { Theme } from '@mui/material/styles';

import type { SxStyles } from '@/ui/style/types';

/**
 * Gets the sx classes for the add-new-layer component.
 *
 * @param theme - The theme object
 * @returns The sx classes object
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  paper: {
    padding: theme.spacing(2.5),
  },
  buttonGroup: {
    marginTop: theme.spacing(1.5),
    gap: theme.spacing(0.75),
  },
  dragOverlay: {
    backgroundColor: theme.palette.geoViewColor?.grey.opacity(0.95),
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    textAlign: 'center',
    color: theme.palette.geoViewColor?.textColor.main,
    fontSize: theme.palette.geoViewFontSize?.xl,
  },
  stepper: {
    '& .MuiStepLabel-label:not(.Mui-active):not(.Mui-completed)': {
      color: theme.palette.geoViewColor?.textColor.light[200], // WCAG - Matches global placeholder text color
    },
  },
  layerTreeContainer: {
    // Targets the inner content wrapper when the main item or root receives native JS focus
    '& .MuiTreeItem-root:focus > .MuiTreeItem-content, & .MuiTreeItem-root:focus-within > .MuiTreeItem-content': {
      backgroundColor: theme.palette.action.hover,
    },
  },
});
