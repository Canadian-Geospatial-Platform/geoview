import type { Theme } from '@mui/material';
import type { SxStyles } from '@/ui/style/types';
import { visuallyHidden } from '@/ui/style/default';

/**
 * Gets custom sx classes for the common layer list.
 *
 * @param theme - The MUI theme object
 * @returns The sx classes object
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  list: {
    color: 'text.primary',
    height: 'fit-content',
    width: '100%',
    '& .MuiListItemText-primary': {
      fontSize: theme.palette.geoViewFontSize?.lg,
      fontWeight: '600',
    },
    '& .MuiListItem-root': {
      '& .MuiListItemButton-root': {
        padding: theme.spacing(0, 0.25, 0, 2),
        height: '100%',
        backgroundColor: theme.palette.geoViewColor?.bgColor.light[500],
      },
    },
    '& .MuiListItemButton-root': {
      minHeight: '73px',
    },
    '& .MuiListItemIcon-root': {
      minWidth: '2rem',
    },
    '& .MuiListItemText-root': {
      '> span': {
        fontSize: theme.palette.geoViewFontSize?.default,
      },
      '> p': {
        fontSize: theme.palette.geoViewFontSize?.sm,
      },
    },
  },
  listItemButton: {
    width: '100%',
    borderRadius: '5px',
    gap: theme.spacing(1.5),
    '&.Mui-selected:hover': {
      backgroundColor: 'inherit',
    },
    '&.Mui-selected.Mui-focusVisible': {
      backgroundColor: 'inherit',
    },
    '&.Mui-focusVisible': {
      outlineOffset: '-2px',
      boxShadow: 'none',
    },
  },
  listItemButtonHidden: {
    // Hidden rows are not a control (only the eye toggle acts); keep them looking non-clickable
    cursor: 'default',
    '&:hover': {
      backgroundColor: 'inherit',
    },
  },
  listPrimaryText: {
    minWidth: '0',
    flex: '1 1 auto',
    display: 'flex',
    flexDirection: 'column',
    margin: theme.spacing(0.75, 0),
    '& .layerTitle': {
      fontSize: theme.palette.geoViewFontSize?.default,
      fontWeight: '600',
      lineHeight: 1.5,
      paddingRight: theme.spacing(1.25),
      display: 'block',
    },
    '>div': {
      display: 'flex',
      alignItems: 'center',
      marginTop: theme.spacing(0.5),
      '>p': {
        fontSize: `${theme.palette.geoViewFontSize?.sm} !important`,
        color: theme.palette.text.secondary,
        fontWeight: 400,
      },
      ' svg': {
        width: '0.75em',
        height: '0.75em',
      },
    },
  },
  outOfRange: {
    '.layer-panel &.MuiListItemButton-root': {
      '& .MuiListItemText-primary': {
        color: `${theme.palette.grey[700]} !important`,
        fontStyle: 'italic',
      },
      '& .MuiListItemText-secondary': {
        color: theme.palette.grey[600],
        fontStyle: 'italic',
      },
    },
  },
  progressBar: {
    display: 'block',
    width: '100%',
    position: 'absolute',
    bottom: 0,
    '> span': { height: '2px' },
  },
  progressBarSingleLayer: {
    position: 'absolute !important',
    display: 'block !important',
    bottom: '0',
    width: '100%',
    height: 'auto !important',
    '> span': { height: '2px' },
  },
  layerCount: {
    display: 'none',
    position: 'absolute',
    right: '12px',
    top: '12px',
  },
  orderButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    pointerEvents: 'none',
  },
  orderButtonEnabled: {
    opacity: 1,
    cursor: 'pointer',
    pointerEvents: 'auto',
  },
  dividerVertical: {
    marginLeft: theme.spacing(0.75),
    height: '1.5rem',
    backgroundColor: theme.palette.geoViewColor?.bgColor.dark[300],
  },
  zoomButton: {
    height: 40,
    width: 40,
  },
  listSectionHeader: {
    display: 'block',
    padding: theme.spacing(1.5, 0, 0.5, 2),
    fontSize: theme.palette.geoViewFontSize?.sm,
    fontWeight: 700,
    textTransform: 'uppercase',
    color: theme.palette.text.primary,
  },
  showHiddenLayerButton: {
    position: 'absolute',
    right: '8px',
    top: '50%',
    transform: 'translateY(-50%)',
    // Keep the eye toggle looking actionable (not greyed like the disabled item) so users know they can restore visibility
    color: theme.palette.geoViewColor?.primary.main,
    '&:hover': {
      color: theme.palette.geoViewColor?.primary.dark[200],
      backgroundColor: theme.palette.geoViewColor?.primary.lighten(0.9, 0.3),
    },
  },
  listPrimaryTextHidden: {
    paddingRight: theme.spacing(5),
    // Match the Layers panel "not visible" symbology: greyed + italic text
    '& .layerTitle': {
      color: theme.palette.grey[700],
      fontStyle: 'italic',
    },
    '& > div > p': {
      fontStyle: 'italic',
    },
  },
  containerBox: {
    width: '100%',
    cursor: 'pointer',
  },
  visuallyHidden,
});
