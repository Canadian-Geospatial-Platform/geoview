import { useTheme } from '@mui/material';
import { Typography } from '@/ui';

interface LayerTitleProp {
  children: React.ReactNode;
  hideTitle?: boolean;
}

/**
 * Create Layer Title.
 * @param {string} children the name of the layer.
 * @param {boolean} hideTitle hide the layer title for desktop view.
 * @returns JSX.Element
 */
export function LayerTitle({ children, hideTitle }: LayerTitleProp) {
  const theme = useTheme();

  return (
    <Typography
      sx={{
        font: theme.footerPanel.layerTitleFont,
        marginTop: '12px',
        [theme.breakpoints.up('md')]: { display: hideTitle ? 'none' : 'block' },
      }}
      component="div"
    >
      {children}
    </Typography>
  );
}

LayerTitle.defaultProps = {
  hideTitle: false,
};
