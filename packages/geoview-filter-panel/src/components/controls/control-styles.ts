import type { SxStyles } from 'geoview-core/ui/style/types';

/**
 * Gets the style classes for filter controls.
 *
 * @param theme - The MUI theme object
 * @returns The SxStyles object containing style definitions
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSxClasses = (theme: any): SxStyles => ({
  // Common control wrapper
  filterControl: {
    mb: 2,
    '&:last-child': {
      mb: 0,
    },
  },

  // Label text
  filterLabel: {
    display: 'block',
    mb: 0.75,
    mt: '5px',
    fontWeight: 500,
    fontSize: theme.palette.geoViewFontSize?.sm || '0.875rem',
  },

  // Loading/empty states
  filterLoading: {
    color: 'text.secondary',
    fontStyle: 'italic',
  },

  // Multiselect checkbox container
  filterMultiselectContainer: {
    maxHeight: '200px',
    overflowY: 'auto',
    border: 1,
    borderColor: 'divider',
    borderRadius: 1,
    p: 0.5,
  },

  // Multiselect checkbox item
  filterCheckboxItem: {
    display: 'block',
    ml: 0,
  },

  // Date range container
  filterDateRangeContainer: {
    display: 'flex',
    gap: 1,
    alignItems: 'center',
  },

  // Date range separator
  filterDateSeparator: {
    color: 'text.secondary',
    px: 1,
  },

  // Date range info text
  filterDateInfo: {
    color: 'text.secondary',
    mt: 0.5,
    display: 'block',
  },

  // Range slider container
  filterSliderContainer: {
    px: 1.5,
    pt: 1,
  },

  // Range value display container
  filterRangeValues: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.75rem',
    color: 'text.secondary',
    px: 1.5,
  },
});
