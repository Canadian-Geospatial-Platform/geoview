import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
  legendContainer: {
    background: theme.footerPanel.contentBg,
    boxShadow: theme.footerPanel.contentShadow,
    padding: '40px 20px 20px 20px',
    display: 'flex',
    flexDirection: 'column',
  },
  legendTitle: {
    textAlign: 'left',
    fontFamily: 'Open Sans, Semibold',
    fontSize: '18px',
  },
  categoryTitleContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '15px',
  },
  categoryTitle: {
    textAlign: 'left',
    font: theme.footerPanel.titleFont,
    fontSize: '20px',
  },
  legendButton: {
    font: 'normal normal medium 16px/611px Noto Sans Myanmar',
    color: '#515BA5',
    backgroundColor: '#F4F5FF',
    fontWeight: 'bold',
    fontSize: '16px',
  },
  legendButtonText: {
    font: 'normal normal medium 16px/611px Noto Sans Myanmar',
    textTransform: 'capitalize',
    fontWeight: 'bold',
    color: '#515BA5',
    fontSize: '16px',
  },
});
