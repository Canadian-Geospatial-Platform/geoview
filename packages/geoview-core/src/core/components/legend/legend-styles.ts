import type { Theme } from '@mui/material/styles';
import { visuallyHidden } from '@/ui/style/default';

type SxClasses = Record<string, object>;

/**
 * Generates the main SX classes for styling components
 * @returns An object containing the style classes
 */
export const getSxClassesMain = (): SxClasses => ({
  legendWrapper: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  container: {
    padding: '16px',
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
    color: theme.palette.geoViewColor.textColor.main,
    fontSize: theme.palette.geoViewFontSize.md,
  },
  subtitle: {
    fontWeight: 'normal',
    fontSize: theme.palette.geoViewFontSize.md,
    textAlign: 'left',
  },
  legendList: {
    paddingRight: '0.65rem',
  },
  loading: {
    display: 'block !important',
    bottom: '0',
    width: '100%',
    height: 'auto !important',
    span: { height: '2px' },
  },
  legendListItem: {
    padding: '6px 4px',
    flexDirection: 'column',
    alignItems: 'flex-start',
    '& .MuiCollapse-vertical': {
      marginLeft: '6px',
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
    gap: 8,
    alignItems: 'center',
    borderBottom: `1px solid ${theme.palette.geoViewColor.bgColor.dark[100]}`,
  },
  legendListItemHeaderText: {
    overflowWrap: 'break-word',
    wordBreak: 'normal',
    hyphens: 'auto',
  },
  legendTitle: {
    fontSize: theme.palette.geoViewFontSize.md,
    fontWeight: '600',
    '& div': {
      fontSize: 'inherit',
      fontWeight: 'inherit',
    },
    '>p': {
      margin: 0,
      color: theme.palette.geoViewColor.textColor.light[400],
      fontSize: theme.palette.geoViewFontSize.sm,
      lineHeight: 1.43,
    },
    '& .MuiListItemText-secondary': {
      color: theme.palette.geoViewColor.textColor.light[400],
    },
  },
  layerList: {
    marginTop: 0,
    padding: 0,
    width: '100%',
    '& .MuiListItemIcon-root': {
      minWidth: '1rem',
    },
  },
  layerListItem: {
    paddingLeft: '6px',
    marginBottom: '3px',
    fontWeight: '400',
  },
  layerListItemButton: {
    padding: '0 0 0 6px',
    gap: 8,
    overflowWrap: 'break-word',
    wordBreak: 'normal',
    hyphens: 'auto',
    '&:hover': {
      backgroundColor: 'transparent',
    },
    '&.unchecked': {
      fontStyle: 'italic',
      color: theme.palette.geoViewColor.textColor.light[600],
      borderLeft: `5px solid ${theme.palette.geoViewColor.bgColor.dark[200]}`,
    },
    '&.unchecked:focus, &.unchecked.keyboard-focused': {
      borderLeft: `5px solid ${theme.palette.geoViewColor.bgColor.dark[200]} !important`,
    },
    '&.unchecked.Mui-focusVisible': {
      borderLeft: `5px solid ${theme.palette.geoViewColor.bgColor.dark[200]} !important`,
    },
    '&.checked': {
      borderLeft: `5px solid ${theme.palette.geoViewColor.bgColor.dark[600]}`,
    },
    '&.checked:focus, &.checked.keyboard-focused': {
      borderLeft: `5px solid ${theme.palette.geoViewColor.bgColor.dark[600]} !important`,
    },
    '&.checked.Mui-focusVisible': {
      borderLeft: `5px solid ${theme.palette.geoViewColor.bgColor.dark[600]} !important`,
    },
    '&.Mui-disabled': {
      borderLeft: '5px solid transparent',
      opacity: 1,
    },
  },

  collapsibleContainer: {
    width: '100%',
    padding: '10px 0',
    margin: '0px 10px',
  },
  legendInstructionsTitle: {
    fontSize: theme.palette.geoViewFontSize.lg,
    fontWeight: '600',
    lineHeight: '1.5em',
  },
  legendInstructionsBody: {
    fontSize: theme.palette.geoViewFontSize.default,
  },
  layerStackIcons: {
    flexWrap: 'wrap',
    '& button': {
      padding: '0.25rem',
      marginRight: 0,
      '& svg': {
        width: '1.25rem',
        height: '1.25rem',
      },
    },
  },
  toggleBar: {
    borderBottom: `1px solid ${theme.palette.geoViewColor.bgColor.dark[100]}`,
    padding: 6,
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonDivider: {
    display: 'flex',
    alignItems: 'center',
    marginRight: 2,
    paddingRight: 2,
    position: 'relative',
    '&::after': {
      content: '""',
      position: 'absolute',
      right: 0,
      top: '15%',
      bottom: '15%',
      width: '1px',
      backgroundColor: theme.palette.geoViewColor.bgColor.dark[300],
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
  visuallyHidden,
});
