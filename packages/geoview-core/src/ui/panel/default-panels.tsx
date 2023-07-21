import Typography from '@mui/material/Typography';
import HelpIcon from '@mui/icons-material/Help';
import { TypeButtonPanelProps } from './panel-types';

/**
 * Create a default button panel for the app-bar
 */
export const DefaultPanel: TypeButtonPanelProps = {
  button: {
    id: 'default-button',
    tooltip: 'Default',
    tooltipPlacement: 'right',
    icon: <HelpIcon />,
    type: 'textWithIcon',
  },
  panel: {
    title: 'Default',
    icon: <HelpIcon />,
    content: (
      <Typography variant="body2" color="textSecondary" component="p">
        This is a placeholder panel for the panel components
      </Typography>
    ),
    width: 350,
    status: false,
  },
};
