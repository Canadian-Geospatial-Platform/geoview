import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';

/**
 * Gets custom sx classes for the attribution component.
 *
 * @param theme - The theme object
 * @returns The sx classes object
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  popper: {
    pointerEvents: 'auto',
    zIndex: theme.zIndex.modal + 100,
  },
  popoverPaper: {
    display: 'flex',
    flexDirection: 'column',
    width: '450px',
    minWidth: '180px',
    maxWidth: '70vw',
    maxHeight: 'min(100vh, 200px)',
    backgroundColor: theme.palette.geoViewColor?.bgColor.light[200],
    borderRadius: '5px',
    boxShadow: 2,
  },
  content: {
    padding: '1rem',
    overflowY: 'auto',
    overflowX: 'hidden',
    scrollbarWidth: 'thin',
    scrollbarColor: `${theme.palette.geoViewColor?.primary.main ?? theme.palette.primary.main} transparent`,
    '& p': {
      color: theme.palette.geoViewColor?.textColor.light[250],
      margin: '0.25rem 0',
      overflowWrap: 'break-word',
      wordBreak: 'break-word',
      whiteSpace: 'pre-wrap',
    },
  },
  iconButton: {
    width: '30px',
    height: '30px',
    my: '1rem',
    margin: 'auto',
  },
});
