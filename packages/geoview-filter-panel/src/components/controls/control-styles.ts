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
    marginBottom: theme.spacing(0.25),
    '&:last-child': {
      marginBottom: theme.spacing(0),
    },
  },

  // Label text
  filterLabel: {
    display: 'block',
    marginBottom: theme.spacing(0.75),
    marginTop: theme.spacing(0.5),
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
    marginLeft: theme.spacing(0),
  },

  // Wrapper merging the search input and checkbox list into a single bordered box
  filterMultiselectWrapper: {
    border: 1,
    borderColor: theme.palette.geoViewColor?.bgColor?.dark?.[100] || 'divider',
    borderRadius: 1,
    overflow: 'hidden',
    padding: theme.spacing(0.5),
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
    paddingTop: theme.spacing(0.5),
    paddingLeft: theme.spacing(0.75),
    paddingRight: theme.spacing(0.75),
    display: 'block',
    fontSize: theme.palette.geoViewFontSize?.sm || '0.875rem',
  },

  // Range slider container
  filterSliderContainer: {
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(3),
    paddingTop: theme.spacing(1),
  },

  // Range value display container
  filterRangeValues: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: theme.palette.geoViewFontSize?.sm || '0.875rem',
    color: theme.palette.geoViewColor?.textColor?.light?.[400] || 'text.secondary',
    paddingLeft: theme.spacing(0.75),
    paddingRight: theme.spacing(0.75),
  },

  // Select placeholder text (shown when no value is selected)
  selectPlaceholder: {
    color: theme.palette.geoViewColor?.textColor?.light?.[400] || 'text.secondary',
  },
});
