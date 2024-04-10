import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
  geochartInstructionsTitle: {
    fontSize: theme.palette.geoViewFontSize.lg,
    fontWeight: '600',
    lineHeight: '1.5em',
  },
  geochartInstructionsBody: {
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
