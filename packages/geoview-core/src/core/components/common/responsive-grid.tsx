import { ReactNode } from 'react';
import { GridProps, SxProps } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Grid } from '@/ui';

interface ResponsiveGridProps extends GridProps {
  children: ReactNode;
}

interface ResponsiveGridPanelProps extends GridProps {
  children: ReactNode;
  isLayersPanelVisible: boolean;
  sxProps?: SxProps;
}

/**
 * Create Responsive Grid Container
 * @param {ReactNode} children children to be renderer
 * @returns JSX.Element
 */
function ResponsiveGridRoot({ children, ...rest }: ResponsiveGridProps) {
  return (
    <Grid container {...rest} paddingLeft={12} paddingRight={12}>
      {children}
    </Grid>
  );
}

/**
 * Create Left Panel for responsive grid.
 * @param {ReactNode} children child elements to be rendered
 * @param {boolean} isLayersPanelVisible panel visibility
 * @returns JSX.Element
 */
function ResponsiveGridLeftPanel({ children, isLayersPanelVisible = false, ...rest }: ResponsiveGridPanelProps) {
  const theme = useTheme();

  return (
    <Grid
      item
      sx={{
        [theme.breakpoints.down('md')]: { display: isLayersPanelVisible ? 'block' : 'none' },
      }}
      {...rest}
    >
      {children}
    </Grid>
  );
}

/**
 * Create Right Panel for responsive grid.
 * @param {ReactNode} children child elements to be rendered
 * @param {boolean} isLayersPanelVisible panel visibility
 * @returns JSX.Element
 */
function ResponsiveGridRightPanel({ children, isLayersPanelVisible = false, sxProps = {}, ...rest }: ResponsiveGridPanelProps) {
  const theme = useTheme();
  return (
    <Grid
      item
      sx={{
        position: 'relative',
        [theme.breakpoints.up('md')]: { paddingLeft: '1rem' },
        [theme.breakpoints.down('md')]: { display: !isLayersPanelVisible ? 'block' : 'none' },
        ...sxProps,
      }}
      {...rest}
    >
      {children}
    </Grid>
  );
}

export const ResponsiveGrid = {
  Root: ResponsiveGridRoot,
  Left: ResponsiveGridLeftPanel,
  Right: ResponsiveGridRightPanel,
};
