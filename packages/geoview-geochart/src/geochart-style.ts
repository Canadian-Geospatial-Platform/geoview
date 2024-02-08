import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
  geochartInstructionsTitle: {
    fontSize: theme.palette.geoViewFontSize.lg,
    fontWeight: '600',
    fontSize: '1.5rem',
    lineHeight: '1.5em',
  },
  geochartInstructionsBody: {
    fontSize: '1rem',
  },
});
