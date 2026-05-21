import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';

/**
 * Gets custom sx classes for the resize footer panel.
 *
 * @param theme - The MUI theme
 * @returns The sx classes object
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  panel: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: theme.palette.geoViewColor?.bgColor.light[200],
    borderRadius: '5px',
    boxShadow: 2,
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px',
    borderBottom: `1px solid ${theme.palette.geoViewColor?.bgColor.dark[100]}`,
  },
  title: {
    fontSize: theme.palette.geoViewFontSize?.default,
    fontWeight: '700',
    color: theme.palette.geoViewColor?.textColor.main,
  },
  slider: {
    height: 300,
    padding: '1.5rem 0.5rem 1.5rem 3.5rem',
    '& .MuiSlider-markLabel': {
      left: '33px',
      '&:nth-of-type(1)': {
        bottom: '3%',
      },
      '&:last-of-type': {
        bottom: '98%',
        left: '30px',
      },
    },
  },
});
