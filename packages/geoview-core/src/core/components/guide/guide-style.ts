import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
  guideContainer: {
    background: theme.footerPanel.contentBg,
    paddingBottom: '1rem',
  },
  rightPanelContainer: {
    border: `2px solid ${theme.palette.primary.main}`,
    borderRadius: '5px',
    backgroundColor: theme.palette.common.white,
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
  footerGuideListItemBoxContainer: {
    background: theme.footerPanel.contentBg,
    boxShadow: theme.footerPanel.contentShadow,
    padding: '0px',
    margin: '20px',
    width: 'unset',
    boxSizing: 'border-box',
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
