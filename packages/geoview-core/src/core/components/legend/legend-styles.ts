import type { Theme } from '@mui/material/styles';
import { visuallyHidden } from '@/ui/style/default';

type SxClasses = Record<string, object>;

/**
 * Generates the main SX classes for styling components.
 *
 * @param theme - The theme object, used for spacing values via `theme.spacing()`
 * @returns An object containing the style classes
 */
export const getSxClassesMain = (theme: Theme): SxClasses => ({
  legendWrapper: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  container: {
    background: theme.palette.geoViewColor?.bgColor.main,
    padding: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    overflowX: 'hidden',
    flex: '1 1 auto',
    minHeight: 0,
  },
});

/**
 * Get custom sx classes for the legend
 *
 * @param theme - The theme object
 * @returns The sx classes object
 */
export const getSxClasses = (theme: Theme): SxClasses => ({
  title: {
    textAlign: 'left',
    fontWeight: '600',
    color: theme.palette.geoViewColor?.textColor.main,
    fontSize: theme.palette.geoViewFontSize?.md,
  },
  layerStackContainer: {
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing(0.75),
    '& button': {
      padding: theme.spacing(0.5),
      marginRight: theme.spacing(0),
      '& svg': {
        width: '1.25rem',
        height: '1.25rem',
      },
    },
  },
  layerStackSubtitle: {
    fontSize: theme.palette.geoViewFontSize?.sm,
  },
  layerStackIcons: {
    display: 'flex',
    alignItems: 'center',
  },
  legendList: {
    paddingRight: theme.spacing(1.25),
  },
  loading: {
    display: 'block !important',
    bottom: '0',
    width: '100%',
    height: 'auto !important',
    span: { height: '2px' },
  },
  legendListItem: {
    padding: theme.spacing(0.75, 0.5),
    flexDirection: 'column',
    alignItems: 'flex-start',
    '& .MuiCollapse-vertical': {
      marginLeft: theme.spacing(0.75),
    },
    '& .outOfRange': {
      '& .legendTitle': {
        color: `${theme.palette.grey[700]}`,
        fontStyle: 'italic',
      },
    },
  },
  legendListItemHeader: {
    width: '100%',
    display: 'flex',
    gap: theme.spacing(1.5),
    alignItems: 'center',
    borderBottom: `1px solid ${theme.palette.geoViewColor?.bgColor.dark[100]}`,
  },
  legendTitle: {
    fontSize: theme.palette.geoViewFontSize?.md,
    fontWeight: '600',
    '& div': {
      fontSize: 'inherit',
      fontWeight: 'inherit',
    },
    '>p': {
      margin: theme.spacing(0),
      color: theme.palette.geoViewColor?.textColor.light[400],
      fontSize: theme.palette.geoViewFontSize?.sm,
      lineHeight: 1.43,
    },
    '& .MuiListItemText-secondary': {
      color: theme.palette.geoViewColor?.textColor.light[400],
    },
  },
  layerList: {
    marginTop: theme.spacing(0),
    padding: theme.spacing(0),
    width: '100%',
    '& .MuiListItemIcon-root': {
      minWidth: '1rem',
    },
  },
  layerListItem: {
    paddingLeft: theme.spacing(0.75),
    marginBottom: theme.spacing(0.75),
    fontWeight: '400',
  },
  layerListItemButton: {
    padding: theme.spacing(0, 0, 0, 0.75),
    gap: theme.spacing(1.5),
    '&:hover': {
      backgroundColor: 'transparent',
    },
    '&.unchecked': {
      fontStyle: 'italic',
      color: theme.palette.geoViewColor?.textColor.light[600],
      borderLeft: `5px solid ${theme.palette.geoViewColor?.bgColor.dark[200]}`,
    },
    '&.unchecked:focus-visible, &.unchecked.Mui-focusVisible': {
      borderLeft: `5px solid ${theme.palette.geoViewColor?.bgColor.dark[200]} !important`,
    },
    '&.checked': {
      borderLeft: `5px solid ${theme.palette.geoViewColor?.bgColor.dark[600]}`,
    },
    '&.checked:focus-visible, &.checked.Mui-focusVisible': {
      borderLeft: `5px solid ${theme.palette.geoViewColor?.bgColor.dark[600]} !important`,
    },
    '&.Mui-disabled': {
      borderLeft: '5px solid transparent',
      opacity: 1,
    },
  },

  collapsibleContainer: {
    width: '100%',
    padding: theme.spacing(1.25, 0),
    margin: theme.spacing(0, 1.25),
  },
  legendInstructionsTitle: {
    fontSize: theme.palette.geoViewFontSize?.lg,
    fontWeight: '600',
    lineHeight: '1.5em',
  },
  legendInstructionsBody: {
    fontSize: theme.palette.geoViewFontSize?.default,
  },
  toggleBar: {
    borderBottom: `1px solid ${theme.palette.geoViewColor?.bgColor.dark[100]}`,
    padding: theme.spacing(1),
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonDivider: {
    display: 'flex',
    alignItems: 'center',
    marginRight: theme.spacing(0.5),
    paddingRight: theme.spacing(0.5),
    position: 'relative',
    '&::after': {
      content: '""',
      position: 'absolute',
      right: 0,
      top: '15%',
      bottom: '15%',
      width: '1px',
      backgroundColor: theme.palette.geoViewColor?.bgColor.dark[300],
    },
  },
  fullscreenContainer: {
    background: 'transparent',
    pointerEvents: 'none',
    userSelect: 'none',
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    '& .layerListItemButton': {
      borderLeft: 'none !important',
    },
  },
  imageButton: {
    backgroundColor: 'transparent',
    '&:focus-visible': {
      border: '2px solid currentColor',
    },
  },
  wmsImage: {
    maxWidth: '100%',
    height: 'auto',
    display: 'block',
  },
  noLayersContainer: {
    padding: theme.spacing(4),
    margin: theme.spacing(4),
    width: '100%',
    textAlign: 'center',
    height: 'fit-content',
  },
  flexContainer: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  visuallyHidden,
});
