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
    padding: '10px 10px',
  },
  headerContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    gap: '16px',
    boxShadow: '0px 12px 9px -13px #E0E0E0',
    flexWrap: 'wrap',
  },
  panelTitle: {
    fontSize: theme.palette.geoViewFontSize?.lg,
    fontWeight: '600',
  },
  centeredContainer: {
    textAlign: 'center',
    paddingTop: '20px',
  },
  controlWrapper: {
    paddingLeft: '10px',
  },
  formControlWidth: {
    width: '100px',
  },
  descriptionText: {
    px: theme.spacing(2.5),
    py: theme.spacing(0.625),
    paddingTop: '15px',
    fontSize: theme.palette.geoViewFontSize?.sm,
  },
});
