import { Theme } from '@mui/material/styles';

// ? I doubt we want to define an explicit type for style properties?
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSxClasses = (theme: Theme): any => ({
  guideContainer: {
    background: theme.palette.geoViewColor.bgColor.main,
    paddingBottom: '1rem',
  },
  rightPanelContainer: {
    color: theme.palette.geoViewColor.textColor.main,
  },
  guideBox: {
    ml: '30px',
    mb: '18px',
    td: {
      width: 'auto',
      paddingLeft: '15px',
    },
    th: {
      textAlign: 'left',
      paddingLeft: '15px',
    },
  },
  footerGuideListItemText: {
    '&:hover': {
      cursor: 'pointer',
    },
    '& .MuiListItemText-primary': {
      padding: '15px',
      fontSize: `${theme.palette.geoViewFontSize.lg} !important`,
      lineHeight: 1.5,
      fontWeight: '700',
      textTransform: 'capitalize',
    },
  },
  footerGuideListItemCollapse: {
    '& .MuiListItemText-primary': {
      padding: '15px 15px 15px 30px',
      fontSize: `${theme.palette.geoViewFontSize.md} !important`,
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
