import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
  detailsContainer: {
    background: theme.footerPanel.contentBg,
    boxShadow: theme.footerPanel.contentShadow,
    padding: '1rem 0',
    '>div': {
      marginBottom: '1rem',
    },
  },
  panelHeaders: {
    font: theme.footerPanel.titleFont,
    marginBottom: '20px',
  },
  layerListPaper: {
    marginBottom: '1rem',
    cursor: 'pointer',
    textOverflow: 'ellipsis',
  },
  listItemIcon: {
    color: theme.palette.primary.main,
    background: theme.footerPanel.contentBg,
  },
  layerNamePrimary: {
    '& .MuiListItemText-primary': {
      font: theme.footerPanel.layerTitleFont,
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
      font: theme.footerPanel.layerTitleFont,
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
        fontSize: '1rem',
      },
      '> p': {
        fontSize: '0.875rem',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
    },
  },
  rightPanelContainer: {
    border: `2px solid ${theme.palette.primary.main}`,
    borderRadius: '5px',
    backgroundColor: theme.palette.common.white,
  },
  rightPanelBtnHolder: {
    marginTop: '20px',
    marginBottom: '9px',
    boxShadow: '0px 12px 9px -13px #E0E0E0',
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
      fontSize: '1rem',
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
        fontSize: '0.875rem !important',
        color: theme.palette.text.secondary,
      },
      ' svg': {
        width: '0.75em',
        height: '0.75em',
      },
    },
  },
});
