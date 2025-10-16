import type { SxStyles } from '@/ui/style/types';

/**
 * Get custom sx classes for the map information bar
 *
 * @returns {Object} the sx classes object
 */
export const getSxClasses = (): SxStyles => ({
  mouseScaleControlsContainer: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'noWrap',
    '& button': {
      cursor: 'pointer',
      margin: 'auto 0 auto auto',
    },
    justifyContent: 'end',
    '&.interaction-static': {
      backdropFilter: 'unset',
      backgroundColor: 'unset',
      color: `black !important`,
      fill: `black !important`,
      position: 'absolute',
      width: 'calc(100% - 60px)',
      bottom: 0,
      left: '60px',

      '& button svg': {
        fill: `black !important`,
      },
      '& button span': {
        color: `black !important`,
      },
    },
  },
  rotationControlsContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },

  // map-info-expand-button.tsx
  expandButton: {
    display: { xs: 'none', sm: 'none', md: 'flex', lg: 'flex', xl: 'flex' },
  },
});
