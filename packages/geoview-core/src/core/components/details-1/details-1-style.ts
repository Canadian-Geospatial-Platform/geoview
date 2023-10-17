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
    '& .MuiListItemText-primary': {
      font: theme.footerPanel.layerTitleFont,
    },
  },
  featureInfoListContainer: {
    paddingLeft: '25px',
    paddingRight: '25px',
    paddingBottom: '25px',
    height: 'auto',
    maxHeight: '80%',
    overflowY: 'auto',
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
    marginRight: 0,
    wordBreak: 'break-word',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  boxContainerFeatureInfo: {
    wordWrap: 'break-word',
    fontSize: '16px',
    lineHeight: '19px',
  },
});
