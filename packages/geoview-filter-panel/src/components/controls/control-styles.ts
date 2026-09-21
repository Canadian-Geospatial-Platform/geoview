import type { Theme, SxStyles } from 'geoview-core/ui/style/types';

/**
 * Gets the style classes for filter controls.
 *
 * @param theme - The MUI theme object
 * @returns The SxStyles object containing style definitions
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
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
    fontSize: theme.palette.geoViewFontSize?.md || '1rem',
  },

  // Loading/empty states
  filterLoading: {
    color: theme.palette.geoViewColor?.textColor?.light?.[400] || 'text.secondary',
    fontStyle: 'italic',
    fontSize: theme.palette.geoViewFontSize?.md || '1rem',
  },

  // Multiselect checkbox item
  filterCheckboxItem: {
    display: 'block',
    ml: 0,
  },

  // Wrapper merging the search input and checkbox list into a single bordered box
  filterMultiselectWrapper: {
    border: 1,
    borderColor: theme.palette.geoViewColor?.bgColor?.dark?.[100] || 'divider',
    borderRadius: 1,
    overflow: 'hidden',
  },

  // Search row above the list — no border of its own, just the standard-variant underline
  filterMultiselectSearch: {
    px: 1,
    pt: 0.5,
    '& .MuiInput-input': {
      pl: '0.5em',
    },
  },

  // Multiselect checkbox list — border/radius now live on the wrapper, not here
  filterMultiselectContainer: {
    maxHeight: '200px',
    overflowY: 'auto',
    p: 0.5,
  },

  // Date range info text
  filterDateInfo: {
    color: theme.palette.geoViewColor?.textColor?.light?.[400] || 'text.secondary',
    pt: 0.5,
    px: 5,
    display: 'block',
    fontSize: theme.palette.geoViewFontSize?.sm || '0.875rem',
  },

  // Range slider container
  filterSliderContainer: {
    px: '25px',
    pt: 1,
  },

  // Range value display container
  filterRangeValues: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: theme.palette.geoViewFontSize?.sm || '0.875rem',
    color: theme.palette.geoViewColor?.textColor?.light?.[400] || 'text.secondary',
    px: 5,
  },
});
