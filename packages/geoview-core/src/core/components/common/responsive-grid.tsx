import { ReactNode, forwardRef } from 'react';
import { useTheme } from '@mui/material/styles';
import { Grid, GridProps, SxProps } from '@/ui';

interface ResponsiveGridProps extends GridProps {
  children: ReactNode;
}

interface ResponsiveGridPanelProps extends GridProps {
  children: ReactNode;
  isRightPanelVisible: boolean;
  sxProps?: SxProps | undefined;
  isEnlarged: boolean;
  fullWidth?: boolean;
  className?: string;
}

/**
 * Create Responsive Grid Container
 * @param {ReactNode} children children to be renderer
 * @returns JSX.Element
 */
const ResponsiveGridRoot = forwardRef(({ children, ...rest }: ResponsiveGridProps, ref) => (
  <Grid component="div" container {...rest} paddingLeft={12} paddingRight={12} paddingBottom={12} ref={ref}>
    {children}
  </Grid>
));
ResponsiveGridRoot.displayName = 'ResponsiveGridRoot';

/**
 * Get the left panel grid width size based on fullwidth flag.
 * @param {boolean} fullWidth panel with is maximum.
 * @param {boolean} isRightPanelVisible right panel is visibel
 * @param {boolean} isEnlarged panel is enlarge
 * @returns {any}
 */
// ? I doubt we want to define an explicit type for style properties?
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getLeftPanelSize = (fullWidth: boolean, isRightPanelVisible: boolean, isEnlarged: boolean): any => {
  if (fullWidth) {
    return { xs: 12 };
  }
  return {
    xs: isRightPanelVisible ? 0 : 12,
    md: !isEnlarged ? 4 : 2,
    lg: !isEnlarged ? 4 : 1.25,
  };
};

/**
 * Create Left Panel for responsive grid.
 * @param {ReactNode} children child elements to be rendered
 * @param {boolean} isRightPanelVisible panel visibility
 * @param {boolean} isEnlarged panel is enlarge
 * @returns JSX.Element
 */
const ResponsiveGridLeftPanel = forwardRef(
  (
    {
      children,
      className = '',
      isRightPanelVisible = false,
      sxProps = {},
      isEnlarged,
      fullWidth = false,
      ...rest
    }: ResponsiveGridPanelProps,
    ref,
  ) => {
    const theme = useTheme();
    return (
      <Grid
        className={className}
        size={getLeftPanelSize(fullWidth, isRightPanelVisible, isEnlarged)}
        sx={{
          ...(!fullWidth && { [theme.breakpoints.down('md')]: { display: isRightPanelVisible ? 'none' : 'block' } }),
          ...(fullWidth && { display: isRightPanelVisible ? 'none' : 'block' }),
          ...sxProps,
        }}
        component="div"
        ref={ref}
        {...rest}
      >
        {children}
      </Grid>
    );
  },
);
ResponsiveGridLeftPanel.displayName = 'ResponsiveGridLeftPanel';

/**
 * Get the right panel grid width size based on fullwidth flag.
 * @param {boolean} fullWidth panel with is maximum.
 * @param {boolean} isRightPanelVisible layer panel is visibel
 * @param {boolean} isEnlarged panel is enlarge
 * @returns {any}
 */
// ? I doubt we want to define an explicit type for style properties?
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getRightPanelSize = (fullWidth: boolean, isRightPanelVisible: boolean, isEnlarged: boolean): any => {
  if (fullWidth) {
    return { xs: 12 };
  }
  return {
    xs: !isRightPanelVisible ? 0 : 12,
    md: !isEnlarged ? 8 : 10,
    lg: !isEnlarged ? 8 : 10.75,
  };
};

/**
 * Create Right Panel for responsive grid.
 * @param {ReactNode} children child elements to be rendered
 * @param {boolean} isRightPanelVisible panel visibility
 * @param {boolean} isEnlarged panel is enlarge
 * @param {object} sxProps Optional sx props
 * @returns JSX.Element
 */
const ResponsiveGridRightPanel = forwardRef(
  (
    {
      children,
      className = '',
      isRightPanelVisible = false,
      sxProps = {},
      isEnlarged,
      fullWidth = false,
      ...rest
    }: ResponsiveGridPanelProps,
    ref,
  ) => {
    const theme = useTheme();
    return (
      <Grid
        className={className}
        size={getRightPanelSize(fullWidth, isRightPanelVisible, isEnlarged)}
        sx={{
          position: 'relative',
          [theme.breakpoints.up('md')]: { paddingLeft: '1rem' },
          ...(!fullWidth && { [theme.breakpoints.down('md')]: { display: !isRightPanelVisible ? 'none' : 'block' } }),
          ...(fullWidth && { display: !isRightPanelVisible ? 'none' : 'block' }),
          ...sxProps,
        }}
        component="div"
        ref={ref}
        {...rest}
      >
        {children}
      </Grid>
    );
  },
);
ResponsiveGridRightPanel.displayName = 'ResponsiveGridRightPanel';

export const ResponsiveGrid = {
  Root: ResponsiveGridRoot,
  Left: ResponsiveGridLeftPanel,
  Right: ResponsiveGridRightPanel,
};
