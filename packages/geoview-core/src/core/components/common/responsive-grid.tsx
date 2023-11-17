import { ReactNode } from 'react';
import { useTheme } from '@mui/material/styles';
import { Grid, GridProps, SxProps } from '@/ui';

interface ResponsiveGridProps extends GridProps {
  children: ReactNode;
}

interface ResponsiveGridPanelProps extends GridProps {
  children: ReactNode;
  isLayersPanelVisible: boolean;
  sxProps?: SxProps | undefined;
  isEnlargeDataTable: boolean;
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
function ResponsiveGridLeftPanel({ children, isLayersPanelVisible = false, isEnlargeDataTable, ...rest }: ResponsiveGridPanelProps) {
  const theme = useTheme();

  return (
    <Grid
      item
      xs={isLayersPanelVisible ? 12 : 0}
      md={!isEnlargeDataTable ? 4 : 2}
      lg={!isEnlargeDataTable ? 4 : 1.25}
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
function ResponsiveGridRightPanel({
  children,
  isLayersPanelVisible = false,
  sxProps = {},
  isEnlargeDataTable,
  ...rest
}: ResponsiveGridPanelProps) {
  const theme = useTheme();
  return (
    <Grid
      item
      xs={!isLayersPanelVisible ? 12 : 0}
      md={!isEnlargeDataTable ? 8 : 10}
      lg={!isEnlargeDataTable ? 8 : 10.75}
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
