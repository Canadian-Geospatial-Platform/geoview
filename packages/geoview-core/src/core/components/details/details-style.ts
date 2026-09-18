import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';
import { visuallyHidden } from '@/ui/style/default';

/**
 * Gets the sx classes for the details components.
 *
 * @param theme - The theme object
 * @returns The sx classes object
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  rightPanelContainer: {
    color: theme.palette.geoViewColor?.textColor.main,
  },
  rightPanelStatus: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    padding: theme.spacing(1.25, 2),
    boxShadow: `0px 12px 9px -13px ${theme.palette.geoViewColor?.bgColor.dark[200]}`,
  },
  rightPanelButtons: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(0.5),
    flexWrap: 'wrap',
  },
  featureInfoListContainer: {
    padding: theme.spacing(0, 2, 2, 2),
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  featureDetailListContainer: {
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  featureInfoRow: {
    th: {
      fontWeight: 'bold',
    },
    '& td, & th': {
      verticalAlign: 'top',
      width: '50%',
      padding: theme.spacing(0.5),
      borderBottom: 'none',
      overflowWrap: 'break-word',
      wordBreak: 'break-word',
      whiteSpace: 'pre-wrap',
    },
    '&:nth-of-type(odd)': {
      backgroundColor: theme.palette.geoViewColor?.bgColor.darken(0.1),
      color: theme.palette.geoViewColor?.bgColor.darken(0.9),
    },
  },
  featureInfoItemValue: {
    marginRight: theme.spacing(0),
    overflowX: 'auto',
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
    whiteSpace: 'pre-wrap',
    ' table': {
      border: '1px solid',
      width: '100%',
      borderCollapse: 'collapse',
    },
    ' th, td': {
      border: '1px solid',
      textAlign: 'center',
      padding: theme.spacing(0.5),
      overflowWrap: 'break-word',
      wordBreak: 'break-word',
      whiteSpace: 'pre-wrap',
    },
  },
  featureInfoItemImage: {
    maxWidth: '100%',
    height: 'auto',
    display: 'block',
  },
  boxContainerFeatureInfo: {
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
    whiteSpace: 'pre-wrap',
    fontSize: theme.palette.geoViewFontSize?.default,
    lineHeight: '19px',
    '& .MuiTable-root': {
      tableLayout: 'fixed',
      borderCollapse: 'separate',
      borderSpacing: 0,
    },
  },
  flexBoxAlignCenter: {
    display: 'flex',
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
    gap: theme.spacing(1.25),
    justifyContent: 'space-between',
    marginBottom: theme.spacing(1.25),
    width: '100%',
  },
  imageButton: {
    background: 'transparent',
  },
  coordinateInfoContainer: {
    backgroundColor: theme.palette.geoViewColor?.bgColor.light[600],
    padding: theme.spacing(2),
  },
  coordinateInfoTitle: {
    marginBottom: theme.spacing(2),
  },
  coordinateInfoSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: theme.spacing(1.25),
  },
  coordinateInfoSectionTitle: {
    fontWeight: 'bold',
  },
  coordinateInfoDeclinationContent: {
    marginLeft: theme.spacing(0.25),
  },
  skeletonBox: {
    padding: theme.spacing(1.25),
  },
  skeletonTitle: {
    marginBottom: theme.spacing(0.125),
  },
  skeletonRow: {
    paddingTop: theme.spacing(0.5),
    paddingBottom: theme.spacing(0.5),
    display: 'flex',
    justifyContent: 'space-between',
  },
  visuallyHidden,
});
