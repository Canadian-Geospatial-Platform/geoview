import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
  geochartInstructionsTitle: {
    font: theme.footerPanel.titleFont,
    fontSize: '1.5rem',
    lineHeight: '1.5em',
  },
  geochartInstructionsBody: {
    fontSize: '1rem',
  },
});
