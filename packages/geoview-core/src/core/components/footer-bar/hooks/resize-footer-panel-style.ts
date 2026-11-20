import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';

/**
 * Gets custom sx classes for the resize footer panel.
 *
 * @param theme - The MUI theme
 * @returns The sx classes object
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  root: {
    marginRight: theme.spacing(1),
  },
  popper: {
    pointerEvents: 'auto',
    zIndex: theme.zIndex.modal + 100,
  },
  panel: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: theme.palette.background.paper,
    boxShadow: 2,
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(1.25),
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  title: {
    color: theme.palette.text.primary,
  },
  sliderWrapper: {
    // Shrinks on short viewports (e.g. phone landscape) so the whole popper fits on screen; the header and padding use about 140px
    height: 'min(300px, calc(100dvh - 140px))',
    minHeight: '120px',
    padding: theme.spacing(3, 1, 3, 7),
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
