import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
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
  guideBox: {
    ml: '30px',
    mb: '18px',
    td: {
      width: 'auto',
      paddingLeft: '15px',
    },
    th: {
      textAlign: 'left',
      paddingLeft: '15px',
    },
  },
});
