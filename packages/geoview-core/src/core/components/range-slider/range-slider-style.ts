import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
  detailsContainer: {
    background: theme.footerPanel.contentBg,
    boxShadow: theme.footerPanel.contentShadow,
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
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
    marginLeft: '1rem',
    width: '100%',
    paddingRight: '2rem',
  },
  rightPanelContainer: {
    border: `2px solid ${theme.palette.primary.main}`,
    borderRadius: '5px',
    marginRight: '20px',
    backgroundColor: theme.palette.common.white,
  },
  rightPanelBtnHolder: {
    marginTop: '20px',
    marginBottom: '9px',
    boxShadow: '0px 12px 9px -13px #E0E0E0',
  },
  table: {
    borderRadius: '4px',
    padding: '16px 17px 16px 23px',
  },
  tableRow: {
    '& td': {
      margin: 0,
      padding: '2px 4px 2px 4px',
      alignItems: 'center',
    },
  },
});
