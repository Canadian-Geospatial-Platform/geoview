import type { SxStyles } from 'geoview-core/ui/style/types';

/**
 * Gets custom sx classes for the time slider panel.
 *
 * @returns The sx classes object
 */
export const getSxClasses = (): SxStyles => ({
  layerTooltip: {
    display: 'flex',
    alignContent: 'center',
    '& svg': { width: '0.75em', height: '0.75em' },
  },
});
