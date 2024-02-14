import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
  detailsContainer: {
    background: theme.palette.geoViewColor.bgColor.main,
    paddingBottom: '1rem',
  },
  detailsInstructionsTitle: {
    fontSize: theme.palette.geoViewFontSize.lg,
    fontWeight: '600',
    lineHeight: '1.5em',
  },
  detailsInstructionsBody: {
    fontSize: '1rem',
  },
  panelHeaders: {
    fontSize: theme.palette.geoViewFontSize.lg,
    fontWeight: '600',
  },
  rightPanelContainer: {
    border: `2px solid ${theme.palette.geoViewColor.primary.main}`,
    borderRadius: '5px',
    // backgroundColor: theme.palette.geoViewColor.white,
    color: theme.palette.geoViewColor.textColor.main,
  },
  rightPanelBtnHolder: {
    marginTop: '20px',
    marginBottom: '9px',
    boxShadow: `0px 12px 9px -13px ${theme.palette.geoViewColor.bgColor.dark[200]}`,
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
    borderColor: theme.palette.geoViewColor.grey.dark[100],
    boxShadow: 2,
    background: theme.palette.geoViewColor.white,
    objectFit: 'scale-down',
    width: '35px',
    height: '35px',
    marginRight: '10px',
  },
  selectFeatureCheckbox: {
    color: theme.palette.geoViewColor.primary.main,
    '&.Mui-checked': {
      color: theme.palette.geoViewColor.primary.main,
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
    fontSize: theme.palette.geoViewFontSize.default,
    lineHeight: '19px',
  },
  flexBoxAlignCenter: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
});
