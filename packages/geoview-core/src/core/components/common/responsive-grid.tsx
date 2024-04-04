import { ReactNode, forwardRef } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, Grid, GridProps, SxProps } from '@/ui';

interface ResponsiveGridProps extends GridProps {
  children: ReactNode;
}

interface ResponsiveGridPanelProps extends GridProps {
  children: ReactNode;
  isLayersPanelVisible: boolean;
  sxProps?: SxProps | undefined;
  isEnlarged: boolean;
  fullWidth?: boolean;
  isFullScreen?: boolean;
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
 * Get the left panel grid width size based on fullwidth flag.
 * @param {boolean} fullWidth panel with is maximum.
 * @param {boolean} isLayersPanelVisible layer panel is visibel
 * @param {boolean} isEnlarged panel is enlarge
 * @returns
 */
const getLeftPanelSize = (fullWidth: boolean, isLayersPanelVisible: boolean, isEnlarged: boolean) => {
  if (fullWidth) {
    return { xs: 12 };
  }
  return {
    xs: isLayersPanelVisible ? 0 : 12,
    md: !isEnlarged ? 4 : 2,
    lg: !isEnlarged ? 4 : 1.25,
  };
};

/**
 * Create Left Panel for responsive grid.
 * @param {ReactNode} children child elements to be rendered
 * @param {boolean} isLayersPanelVisible panel visibility
 * @param {boolean} isEnlarged panel is enlarge
 * @returns JSX.Element
 */
const ResponsiveGridLeftPanel = forwardRef(
  ({ children, isLayersPanelVisible = false, sxProps = {}, isEnlarged, fullWidth = false, ...rest }: ResponsiveGridPanelProps, ref) => {
    const theme = useTheme();
    return (
      <Grid
        item
        {...getLeftPanelSize(fullWidth, isLayersPanelVisible, isEnlarged)}
        sx={{
          ...(!fullWidth && { [theme.breakpoints.down('md')]: { display: isLayersPanelVisible ? 'none' : 'block' } }),
          ...(fullWidth && { display: isLayersPanelVisible ? 'none' : 'block' }),
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
 * Get the right panel grid width size based on fullwidth flag.
 * @param {boolean} fullWidth panel with is maximum.
 * @param {boolean} isLayersPanelVisible layer panel is visibel
 * @param {boolean} isEnlarged panel is enlarge
 * @returns
 */
const getRightPanelSize = (isFullScreen: boolean, fullWidth: boolean, isLayersPanelVisible: boolean, isEnlarged: boolean) => {
  if (fullWidth || isFullScreen) {
    return { xs: 12 };
  }
  return {
    xs: !isLayersPanelVisible ? 0 : 12,
    md: !isEnlarged ? 8 : 10,
    lg: !isEnlarged ? 8 : 10.75,
  };
};

/**
 * Create Right Panel for responsive grid.
 * @param {ReactNode} children child elements to be rendered
 * @param {boolean} isLayersPanelVisible panel visibility
 * @param {boolean} isEnlarged panel is enlarge
 * @param {object} sxProps Optional sx props
 * @returns JSX.Element
 */
const ResponsiveGridRightPanel = forwardRef(
  ({ children, isLayersPanelVisible = false, sxProps = {}, isEnlarged, isFullScreen = false, fullWidth = false, ...rest }: ResponsiveGridPanelProps, ref) => {
    const theme = useTheme();

    const getRightPanelContent = () => {
      return (
        <Grid
          item
          {...getRightPanelSize(isFullScreen, fullWidth, isLayersPanelVisible, isEnlarged)}
          sx={{
            position: 'relative',
            [theme.breakpoints.up('md')]: { paddingLeft: '1rem' },
            ...(!fullWidth && { [theme.breakpoints.down('md')]: { display: !isLayersPanelVisible ? 'none' : 'block' } }),
            ...(fullWidth && { display: !isLayersPanelVisible ? 'none' : 'block' }),
            ...sxProps,
          }}
          component="div"
          ref={ref}
          {...rest}
        >
          {children}
        </Grid>
      );
    };

    if(isFullScreen) {
      const fullScreeSx = {
        position: 'fixed',
        overflow:'scroll',
        top: 0,
        left: 0,
        width:'100dvw',
        maxWidth: '100dvw',
        height: '100dvh',
        maxHeight: '100dvh',
        zIndex:'99999',
        insert: '0px',
        backgroundColor: 'white',
        padding: '10px'
      };
      
      return (
        <Box sx={fullScreeSx}>
          {getRightPanelContent()}
        </Box>
      );
    } else {
      return getRightPanelContent();
    }
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
  fullWidth: false,
};

ResponsiveGridRightPanel.defaultProps = {
  sxProps: undefined,
  fullWidth: false,
};
