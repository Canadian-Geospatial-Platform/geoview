import { SxProps } from '@mui/system';

type SxStyles = Record<string, SxProps>;

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
