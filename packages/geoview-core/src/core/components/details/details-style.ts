import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
  detailsContainer: {
    background: theme.footerPanel.contentBg,
    paddingBottom: '1rem',
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
    border: `2px solid ${theme.palette.geoViewColors.primary}`,
    borderRadius: '5px',
    backgroundColor: theme.palette.common.white,
  },
  rightPanelBtnHolder: {
    marginTop: '20px',
    marginBottom: '9px',
    boxShadow: `0px 12px 9px -13px ${theme.palette.geoViewColors.bgColorDark}`,
  },
  featureInfoListContainer: {
    paddingLeft: '25px',
    paddingRight: '25px',
    paddingBottom: '25px',
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  featureInfoSingleImage: {
    padding: 3,
    borderRadius: 0,
    border: '1px solid',
    borderColor: theme.palette.grey[600],
    boxShadow: theme.footerPanel.boxShadow,
    background: theme.palette.common.white,
    objectFit: 'scale-down',
    width: '35px',
    height: '35px',
  },
  selectFeatureCheckbox: {
    color: theme.palette.geoViewColors.primary,
    '&.Mui-checked': {
      color: theme.palette.geoViewColors.primary,
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
  flexBoxAlignCenter: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
});
