import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
  container: {
    padding: '10px 0px 20px 0px',
  },
  title: {
    textAlign: 'left',
    font: theme.footerPanel.titleFont,
    fontSize: '20px',
  },
  subtitle: {
    font: theme.footerPanel.titleFont,
    fontWeight: 'normal',
    fontSize: '0.9em',
    textAlign: 'left',
    marginBottom: '15px',
  },
  legendLayerListItem: {
    padding: '6px 4px',
  },
  collapsibleContainer: {
    width: '100%',
    padding: '10px 0',
    margin: '0px 10px',
  },
});
