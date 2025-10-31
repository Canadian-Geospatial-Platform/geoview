import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';

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
    padding: '10px 16px',
    boxShadow: `0px 12px 9px -13px ${theme.palette.geoViewColor.bgColor.dark[200]}`,
  },
  featureInfoListContainer: {
    padding: '0 16px 16px',
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  featureDetailListContainer: {
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  featureInfoRow: {
    margin: '5px 0',
    padding: '5px',
    '&:nth-of-type(odd)': {
      backgroundColor: theme.palette.geoViewColor.bgColor.darken(0.1),
      color: theme.palette.geoViewColor.bgColor.darken(0.9),
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
  layoutSwitch: {
    alignItems: 'center',
    display: 'flex',
    gap: '10px',
    justifyContent: 'space-between',
    marginBottom: '10px',
    width: '100%',
  },
  coordinateInfoContainer: {
    backgroundColor: theme.palette.geoViewColor.bgColor.light[600],
    padding: '16px',
  },
  coordinateInfoTitle: {
    mb: 10,
  },
  coordinateInfoSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: '10px',
  },
  coordinateInfoSectionTitle: {
    fontWeight: 'bold',
  },
});
