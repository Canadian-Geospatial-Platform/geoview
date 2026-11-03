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
    fontWeight: theme.typography.fontWeightMedium,
    fontSize: theme.typography.label.fontSize,
  },

  // Loading/empty states
  filterLoading: {
    color: theme.palette.text.secondary,
    fontStyle: 'italic',
  },

  // Multiselect checkbox item
  filterCheckboxItem: {
    display: 'block',
    marginLeft: theme.spacing(0),
  },

  // Wrapper merging the search input and checkbox list into a single bordered box
  filterMultiselectWrapper: {
    border: 1,
    borderColor: theme.palette.divider,
    borderRadius: theme.shape.borderRadiusMd,
    overflow: 'hidden',
    padding: theme.spacing(0.5),
  },

  // Search row above the list — no border of its own, just the standard-variant underline
  filterMultiselectSearch: {
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
    paddingTop: theme.spacing(0.5),
    '& .MuiInput-input': {
      paddingLeft: theme.spacing(1),
    },
  },

  // Multiselect checkbox list — border/radius now live on the wrapper, not here
  filterMultiselectContainer: {
    maxHeight: '200px',
    overflowY: 'auto',
    padding: theme.spacing(0.5),
  },

  // Date range info text
  filterDateInfo: {
    color: theme.palette.text.secondary,
    paddingTop: theme.spacing(0.5),
    paddingLeft: theme.spacing(0.75),
    paddingRight: theme.spacing(0.75),
    display: 'block',
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
    fontSize: theme.typography.body2.fontSize,
    color: theme.palette.text.secondary,
    paddingLeft: theme.spacing(0.75),
    paddingRight: theme.spacing(0.75),
  },

  // Select placeholder text (shown when no value is selected)
  selectPlaceholder: {
    color: theme.palette.text.secondary,
  },
});
