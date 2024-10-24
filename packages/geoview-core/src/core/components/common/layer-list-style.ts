import { Theme } from '@mui/material';

// ? I doubt we want to define an explicit type for style properties?
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSxClasses = (theme: Theme): any => ({
  list: {
    overflowY: 'auto',
    color: 'text.primary',
    width: '100%',
    paddingRight: '14px',
    '& .MuiListItemText-primary': {
      fontSize: theme.palette.geoViewFontSize.lg,
      fontWeight: '600',
    },

    '& .MuiListItem-root': {
      height: '100%',
      '& .MuiListItemButton-root': {
        padding: '0 0 0 16px',
        height: '100%',
        backgroundColor: theme.palette.geoViewColor.bgColor.light[500],
      },
    },
    '& .MuiListItemButton-root': {
      minHeight: '73px',
    },
    '& .MuiListItemIcon-root': {
      minWidth: '2rem',
    },
    '& .MuiListItemText-root': {
      '>span': {
        fontSize: theme.palette.geoViewFontSize.default,
      },
      '> p': {
        fontSize: theme.palette.geoViewFontSize.sm,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
    },
  },
  listPrimaryText: {
    minWidth: '0',
    marginTop: '0.5rem',
    marginBottom: '0.5rem',
    marginLeft: '10px',
    flex: '1 1 auto',
    display: 'flex',
    flexDirection: 'column',
    '& .layerTitle': {
      fontSize: theme.palette.geoViewFontSize.default,
      fontWeight: '600',
      lineHeight: 1.5,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      paddingRight: '10px',
    },
    '>div': {
      display: 'flex',
      alignItems: 'center',
      marginTop: '4px',
      '>p': {
        fontSize: `${theme.palette.geoViewFontSize.sm} !important`,
        color: theme.palette.text.secondary,
        fontWeight: 400,
      },
      ' svg': {
        width: '0.75em',
        height: '0.75em',
      },
    },
  },
  borderWithIndex: `2px solid ${theme.palette.geoViewColor.primary.main} !important`,
  borderNone: 'none',
  headline: { fontSize: theme.palette.geoViewFontSize.md, fontWeight: 'bold' },
  layersInstructionsPaper: {
    padding: '2rem',
    cursor: 'pointer',
  },
  layersInstructionsTitle: {
    fontSize: theme.palette.geoViewFontSize.md,
    fontWeight: '600',
    lineHeight: '1.5em',
  },
  layersInstructionsBody: {
    fontSize: theme.palette.geoViewFontSize.default,
  },
});
