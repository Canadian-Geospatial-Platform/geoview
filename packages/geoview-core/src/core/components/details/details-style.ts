import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
  detailsContainer: {
    background: theme.footerPanel.contentBg,
    boxShadow: theme.footerPanel.contentShadow,
    padding: '1rem 0',
  },
  detailsInstructionsTitle: {
    font: theme.footerPanel.titleFont,
    fontSize: '1.5rem',
  },
  detailsInstructionsBody: {
    fontSize: '1rem',
  },
  panelHeaders: {
    font: theme.footerPanel.titleFont,
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
  featureInfoListContainer: {
    paddingLeft: '25px',
    paddingRight: '25px',
    paddingBottom: '25px',
    height: '600px',
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
