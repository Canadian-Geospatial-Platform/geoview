import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
  detailsInstructionsTitle: {
    font: theme.footerPanel.titleFont,
    fontSize: '1.5rem',
  },
  detailsInstructionsBody: {
    fontSize: '1rem',
  },
});
