import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
  guideContainer: {
    background: theme.palette.geoViewColor.bgColor.main,
    paddingBottom: '1rem',
  },
  rightPanelContainer: {
    border: `2px solid ${theme.palette.primary.main}`,
    borderRadius: '5px',
    backgroundColor: theme.palette.geoViewColor.bgColor.light[500],
    color: theme.palette.geoViewColor.textColor.main,
  },
  footerGuideListItemText: {
    '&:hover': {
      cursor: 'pointer',
    },
    '& .MuiListItemText-primary': {
      padding: '15px',
      fontSize: '21px !important',
      lineHeight: 1.5,
      fontWeight: '700',
      textTransform: 'capitalize',
    },
  },
  footerGuideListItemCollapse: {
    '& .MuiListItemText-primary': {
      padding: '15px 15px 15px 30px',
      fontSize: '1.15rem !important',
      lineHeight: 1.5,
      whiteSpace: 'unset',
    },
  },
  errorMessage: {
    marginLeft: '60px',
    marginTop: '30px',
    marginBottom: '12px',
  },
});
