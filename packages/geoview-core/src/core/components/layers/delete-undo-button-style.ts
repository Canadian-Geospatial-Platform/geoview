import type { SxStyles } from '@/ui/style/types';

/**
 * Gets custom sx classes for the delete/undo layer button.
 *
 * @returns The sx classes object
 */
export const getSxClasses = (): SxStyles => ({
  undoButtonContainer: {
    position: 'relative',
    display: 'inline-flex',
  },
  progressNoTransition: {
    '& .MuiCircularProgress-circle': {
      transition: 'none', // completely disable transitions so it doesn't mess up the progress animation, which relies on requestAnimationFrame and smooth updates to the value prop. If transition is not set to none, the progress circle will only update on weird force renders.
    },
  },
  undoIconOverlay: {
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
