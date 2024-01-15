import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
  layersPanelContainer: {
    background: theme.footerPanel.contentBg,
    paddingBottom: '1rem',
  },
  // descriptions for right panel with buttons(describing what each panel does)
  buttonDescriptionContainer: {
    display: 'flex',
    flexDirection: 'column',
    // alignItems: 'center',

    '& p': {
      margin: '0 3px',
    },
  },
});
