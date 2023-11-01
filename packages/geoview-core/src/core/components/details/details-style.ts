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
    padding: 3,
    borderRadius: 0,
    border: '1px solid',
    borderColor: theme.palette.grey[600],
    boxShadow: 'rgb(0 0 0 / 20%) 0px 3px 1px -2px, rgb(0 0 0 / 14%) 0px 2px 2px 0px, rgb(0 0 0 / 12%) 0px 1px 5px 0px',
    background: theme.palette.common.white,
    objectFit: 'scale-down',
    width: '35px',
    height: '35px',
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
