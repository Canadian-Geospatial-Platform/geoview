import { Theme } from '@mui/material/styles';

// ? I doubt we want to define an explicit type for style properties?
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSxClasses = (theme: Theme): any => ({
  panelHeaders: {
    fontSize: theme.palette.geoViewFontSize.lg,
    fontWeight: '600',
    marginBottom: '20px',
  },
  rightPanelContainer: {
    border: `2px solid ${theme.palette.primary.main}`,
    borderRadius: '5px',
    backgroundColor: theme.palette.common.white,
  },
  rightPanelBtnHolder: {
    marginTop: '20px',
    marginBottom: '9px',
    boxShadow: '0px 12px 9px -13px #E0E0E0',
  },
  timeSliderInstructionsTitle: {
    fontSize: theme.palette.geoViewFontSize.lg,
    fontWeight: '600',
    lineHeight: '1.5em',
  },
  timeSliderInstructionsBody: {
    fontSize: '1rem',
  },
});
