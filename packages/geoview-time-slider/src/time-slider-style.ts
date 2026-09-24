import type { Theme, SxStyles } from 'geoview-core/ui/style/types';

/**
 * Gets custom sx classes for the time slider.
 *
 * Uses optional chaining (?.) for theme.palette.geoViewFontSize properties
 * because plugins may render before GeoView's custom theme is fully initialized.
 *
 * @param theme - The MUI theme object
 * @returns The sx classes object
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  containerPadding: {
    padding: theme.spacing(1.25, 1.25),
  },
  headerContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(2.5),
    gap: theme.spacing(2),
    boxShadow: '0px 12px 9px -13px #E0E0E0',
    flexWrap: 'wrap',
  },
  panelTitle: {
    fontSize: theme.palette.geoViewFontSize?.lg,
    fontWeight: '600',
  },
  centeredContainer: {
    textAlign: 'center',
    paddingTop: theme.spacing(2.5),
  },
  controlWrapper: {
    paddingLeft: theme.spacing(1.25),
  },
  formControlWidth: {
    width: '100px',
  },
  descriptionText: {
    padding: theme.spacing(2, 2.5, 0, 2.5),
    fontSize: theme.palette.geoViewFontSize?.sm,
  },
});
