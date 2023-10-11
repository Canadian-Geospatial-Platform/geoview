import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
  detailsContainer: {
    background: theme.footerPanel.contentBg,
    boxShadow: theme.footerPanel.contentShadow,
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
  },
  footerTopPanleSecondary: {
    font: theme.footerPanel.chooseLayerFont,
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
    font: theme.footerPanel.titleFont,
    marginLeft: '10px',
  },
  list: {
    color: 'text.primary',
    marginLeft: '1rem',
    width: '100%',
    paddingRight: '2rem',
  },
  rightPanleContainer: {
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
  itemText: {
    fontSize: 14,
    noWrap: true,
    '& .MuiListItemText-primary': {
      font: theme.footerPanel.titleFont,
    },
    '& .MuiListItemText-secondary': {
      font: theme.footerPanel.layerSecondaryTitleFont,
      color: theme.palette.common.black,
    },
  },
  featureInfoListContainer: {
    paddingLeft: '25px',
    paddingRight: '25px',
    paddingBottom: '25px',
    height: '410px',
    overflowY: 'scroll',
    overflowX: 'hidden',
  },
  featureInfoSingleImage: {
    width: '35px',
    height: '35px',
    marginRight: '10px',
  },
  selectFeatureCheckbox: {
    color: theme.palette.primary.main,
    '&.Mui-checked': {
      color: theme.palette.primary.main,
    },
  },
  featureInfoItemValue: {
    fontSize: '16px',
    marginRight: 0,
    wordBreak: 'break-word',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
});
