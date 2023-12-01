import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
  layersPanelContainer: {
    background: theme.footerPanel.contentBg,
    boxShadow: theme.footerPanel.contentShadow,
    padding: '1rem 0',
  },
  // descriptions for right panel with buttons(describing what each panel does)
  buttonDescriptionContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
});
