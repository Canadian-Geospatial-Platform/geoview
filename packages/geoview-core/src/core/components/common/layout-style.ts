import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
  panelHeaders: {
    fontSize: theme.palette.geoViewFontSize.lg,
    fontWeight: '600',
    marginBottom: '20px',
  },
  layerListPaper: {
    marginBottom: '1rem',
    cursor: 'pointer',
    textOverflow: 'ellipsis',
  },
  listItemIcon: {
    color: theme.palette.geoViewColor.primary.main,
    background: theme.palette.geoViewColor.bgColor.main,
  },
  layerNamePrimary: {
    '& .MuiListItemText-primary': {
      fontSize: theme.palette.geoViewFontSize.lg,
      fontWeight: '600',
    },
    marginLeft: '10px',
  },
  list: {
    color: 'text.primary',
    width: '100%',
    [theme.breakpoints.up('md')]: {
      paddingRight: '2rem',
    },
    '& .MuiListItemText-primary': {
      fontSize: theme.palette.geoViewFontSize.lg,
      fontWeight: '600',
    },

    '& .MuiListItem-root': {
      height: '100%',
      '& .MuiListItemButton-root': {
        padding: '0 0 0 16px',
        height: '100%',
      },
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
  rightPanelContainer: {
    border: `2px solid ${theme.palette.geoViewColor.primary.main}`,
    borderRadius: '5px',
    backgroundColor: theme.palette.geoViewColor.white,
  },
  rightPanelBtnHolder: {
    marginTop: '20px',
    marginBottom: '9px',
    boxShadow: `0px 12px 9px -13px ${theme.palette.geoViewColor.bgColor.dark[200]}`,
  },
  gridContainer: { paddingLeft: '1rem', paddingRight: '1rem' },
  listPrimaryText: {
    marginLeft: '0.62rem',
    minWidth: '0',
    padding: '1.3rem 0',
    flex: '1 1 auto',
    display: 'flex',
    flexDirection: 'column',
    '& p': {
      fontSize: theme.palette.geoViewFontSize.default,
      font: '600 18px / 24px Roboto, Helvetica, Arial, sans-serif;',
      fontWeight: 400,
      lineHeight: 1.5,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    '>div': {
      display: 'flex',
      alignItems: 'center',
      marginTop: '4px',
      '>p': {
        fontSize: `${theme.palette.geoViewFontSize.sm} 0.875rem !important`,
        color: theme.palette.text.secondary,
      },
      ' svg': {
        width: '0.75em',
        height: '0.75em',
      },
    },
  },
});
