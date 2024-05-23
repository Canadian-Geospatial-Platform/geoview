import { useTheme } from '@mui/material';
import { Typography } from '@/ui';

interface LayerTitleProp {
  children: React.ReactNode;
  hideTitle?: boolean;
  fullWidth?: boolean;
}

/**
 * Create Layer Title.
 * @param {string} children the name of the layer.
 * @param {boolean} hideTitle hide the layer title for desktop view.
 * @param {boolean} fullWidth show and hide title when width of container is maximum.
 * @returns {JSX.Element}
 */
export function LayerTitle({ children, hideTitle, fullWidth }: LayerTitleProp): JSX.Element {
  const theme = useTheme();

   // clamping code copied from https://tailwindcss.com/docs/line-clamp
  const sxClasses = {
    fontSize: fullWidth ? theme.palette.geoViewFontSize.sm : theme.palette.geoViewFontSize.lg,
    fontWeight: '600',
    marginTop: '12px',
    overflow: 'hidden',
    display: '-webkit-box',
    '-webkit-box-orient': 'vertical',
    '-webkit-line-clamp': '2',
    ...(!fullWidth && { [theme.breakpoints.up('md')]: { display: hideTitle ? 'none' : 'block' } }),
  };

  return (
    <Typography
      sx={sxClasses}
      component="div"
    >
      {children}
    </Typography>
  );
}
