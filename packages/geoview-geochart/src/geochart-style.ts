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
  geoChartLayoutContainer: {
    '& .MuiGrid-item:has(> .chart-container)': {
      maxHeight: '900px !important',
    },
  },
});
