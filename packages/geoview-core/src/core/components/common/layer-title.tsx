import { Typography } from '@/ui';
import { useTheme } from '@mui/material';

interface LayerTitleProp {
  children: React.ReactNode;
}

/**
 * Create Layer Title.
 * @param {string} children the name of the layer.
 * @returns JSX.Element
 */
export function LayerTitle({ children }: LayerTitleProp) {
  const theme = useTheme();

  return (
    <Typography
      sx={{ font: theme.footerPanel.layerTitleFont, marginTop: '12px', [theme.breakpoints.up('md')]: { display: 'none' } }}
      component="span"
    >
      {children}
    </Typography>
  );
}
