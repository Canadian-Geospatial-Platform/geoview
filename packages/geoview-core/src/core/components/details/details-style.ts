import { Theme } from '@mui/material/styles';
import { SxStyles } from '@/ui/style/types';

/**
 * Get custom sx classes for the details
 *
 * @param {Theme} theme the theme object
 * @returns {Object} the sx classes object
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
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
    fontSize: theme.palette.geoViewFontSize.default,
  },
  panelHeaders: {
    fontSize: theme.palette.geoViewFontSize.lg,
    fontWeight: '600',
  },
  rightPanelContainer: {
    color: theme.palette.geoViewColor.textColor.main,
  },
  rightPanelBtnHolder: {
    marginTop: '20px',
    paddingBottom: '9px',
    boxShadow: `0px 12px 9px -13px ${theme.palette.geoViewColor.bgColor.dark[200]}`,
  },
  featureInfoListContainer: {
    paddingLeft: '25px',
    paddingRight: '25px',
    paddingBottom: '25px',
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  featureDetailListContainer: {
    overflowY: 'auto',
    overflowX: 'hidden',
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
    overflowX: 'auto',
    textOverflow: 'ellipsis',
    ' table': {
      border: '1px solid',
      width: '100%',
      borderCollapse: 'collapse',
    },
    ' th, td': {
      border: '1px solid',
      wordBreak: 'normal',
      textAllign: 'center',
      padding: '5px',
      whiteSpace: 'nowrap',
    },
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
  featureDetailModal: {
    '& .MuiDialog-container': {
      '& .MuiPaper-root': {
        minWidth: '40rem',
      },
    },
  },
  coordinateInfoContainer: {
    padding: 2,
  },
  coordinateInfoTitle: {
    mb: 2,
    mt: 2,
    ml: 10,
  },
  coordinateInfoSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  coordinateInfoSectionTitle: {
    fontWeight: 'bold',
  },
  coordinateInfoContent: {
    ml: 2,
  },
  coordinateInfoSubContent: {
    ml: 2,
  },
});
