import { ReactNode, forwardRef } from 'react';
import { useTheme } from '@mui/material/styles';
import { Grid, GridProps, SxProps } from '@/ui';

interface ResponsiveGridProps extends GridProps {
  children: ReactNode;
}

interface ResponsiveGridPanelProps extends GridProps {
  children: ReactNode;
  isLayersPanelVisible: boolean;
  sxProps?: SxProps | undefined;
  isEnlarged: boolean;
}

/**
 * Create Responsive Grid Container
 * @param {ReactNode} children children to be renderer
 * @returns JSX.Element
 */
const ResponsiveGridRoot = forwardRef(({ children, ...rest }: ResponsiveGridProps, ref) => (
  <Grid component="div" container {...rest} paddingLeft={12} paddingRight={12} ref={ref}>
    {children}
  </Grid>
));
ResponsiveGridRoot.displayName = 'ResponsiveGridRoot';

/**
 * Create Left Panel for responsive grid.
 * @param {ReactNode} children child elements to be rendered
 * @param {boolean} isLayersPanelVisible panel visibility
 * @param {boolean} isEnlarged panel is enlarge
 * @returns JSX.Element
 */
const ResponsiveGridLeftPanel = forwardRef(
  ({ children, isLayersPanelVisible = false, sxProps = {}, isEnlarged, ...rest }: ResponsiveGridPanelProps, ref) => {
    const theme = useTheme();
    return (
      <Grid
        item
        xs={isLayersPanelVisible ? 0 : 12}
        md={!isEnlarged ? 4 : 2}
        lg={!isEnlarged ? 4 : 1.25}
        sx={{
          [theme.breakpoints.down('md')]: { display: isLayersPanelVisible ? 'none' : 'block' },
          ...sxProps,
        }}
        component="div"
        ref={ref}
        {...rest}
      >
        {children}
      </Grid>
    );
  }
);
ResponsiveGridLeftPanel.displayName = 'ResponsiveGridLeftPanel';

/**
 * Create Right Panel for responsive grid.
 * @param {ReactNode} children child elements to be rendered
 * @param {boolean} isLayersPanelVisible panel visibility
 * @param {boolean} isEnlarged panel is enlarge
 * @param {object} sxProps Optional sx props
 * @returns JSX.Element
 */
const ResponsiveGridRightPanel = forwardRef(
  ({ children, isLayersPanelVisible = false, sxProps = {}, isEnlarged, ...rest }: ResponsiveGridPanelProps, ref) => {
    const theme = useTheme();
    return (
      <Grid
        item
        xs={!isLayersPanelVisible ? 0 : 12}
        md={!isEnlarged ? 8 : 10}
        lg={!isEnlarged ? 8 : 10.75}
        sx={{
          position: 'relative',
          [theme.breakpoints.up('md')]: { paddingLeft: '1rem' },
          [theme.breakpoints.down('md')]: { display: !isLayersPanelVisible ? 'none' : 'block' },
          ...sxProps,
        }}
        component="div"
        ref={ref}
        {...rest}
      >
        {children}
      </Grid>
    );
  }
);
ResponsiveGridRightPanel.displayName = 'ResponsiveGridRightPanel';

export const ResponsiveGrid = {
  Root: ResponsiveGridRoot,
  Left: ResponsiveGridLeftPanel,
  Right: ResponsiveGridRightPanel,
};

ResponsiveGridLeftPanel.defaultProps = {
  sxProps: undefined,
};

ResponsiveGridRightPanel.defaultProps = {
  sxProps: undefined,
};
