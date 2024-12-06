import { ReactNode, forwardRef, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { Grid, GridProps, SxProps } from '@/ui';

interface ResponsiveGridProps extends GridProps {
  children: ReactNode;
}

interface ResponsiveGridPanelProps extends GridProps {
  children: ReactNode;
  isRightPanelVisible: boolean;
  sxProps?: SxProps;
  isEnlarged: boolean;
  fullWidth?: boolean;
  className?: string;
}

type PanelSize = { xs: number } & Record<string, number>;

// Constants outside component to prevent recreating every render
const PADDING = '0 12px 12px 12px';
const MOBILE_BREAKPOINT = 'md';
const DEFAULT_PADDING_LEFT = '1rem';

// Panel size configurations
const PANEL_SIZES = {
  default: { xs: 12 },
  left: {
    normal: { md: 4, lg: 4 },
    enlarged: { md: 2, lg: 1.25 },
  },
  right: {
    normal: { md: 8, lg: 8 },
    enlarged: { md: 10, lg: 10.75 },
  },
} as const;

/**
 * Get the left panel grid width size
 */
const getLeftPanelSize = (fullWidth: boolean, isRightPanelVisible: boolean, isEnlarged: boolean): PanelSize => {
  if (fullWidth) return PANEL_SIZES.default;

  return {
    xs: isRightPanelVisible ? 0 : 12,
    ...(isEnlarged ? PANEL_SIZES.left.enlarged : PANEL_SIZES.left.normal),
  };
};

/**
 * Get the right panel grid width size
 */
const getRightPanelSize = (fullWidth: boolean, isRightPanelVisible: boolean, isEnlarged: boolean): PanelSize => {
  if (fullWidth) return PANEL_SIZES.default;

  return {
    xs: !isRightPanelVisible ? 0 : 12,
    ...(isEnlarged ? PANEL_SIZES.right.enlarged : PANEL_SIZES.right.normal),
  };
};

/**
 * Create Responsive Grid Container
 * @param {ReactNode} children children to be renderer
 * @returns JSX.Element
 */
const ResponsiveGridRoot = forwardRef(({ children, ...rest }: ResponsiveGridProps, ref) => (
  <Grid component="div" container {...rest} padding={PADDING} ref={ref}>
    {children}
  </Grid>
));
ResponsiveGridRoot.displayName = 'ResponsiveGridRoot';

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
    ref
  ) => {
    const theme = useTheme();

    const displayStyles = useMemo(
      () => ({
        [theme.breakpoints.down(MOBILE_BREAKPOINT)]: {
          display: isRightPanelVisible ? 'none' : 'block',
        },
      }),
      [isRightPanelVisible, theme.breakpoints]
    );

    return (
      <Grid
        className={className}
        size={getLeftPanelSize(fullWidth, isRightPanelVisible, isEnlarged)}
        sx={{
          ...(!fullWidth && displayStyles),
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
  }
);
ResponsiveGridLeftPanel.displayName = 'ResponsiveGridLeftPanel';

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
    ref
  ) => {
    const theme = useTheme();

    const displayStyles = useMemo(
      () => ({
        [theme.breakpoints.down(MOBILE_BREAKPOINT)]: {
          display: !isRightPanelVisible ? 'none' : 'block',
        },
      }),
      [isRightPanelVisible, theme.breakpoints]
    );

    return (
      <Grid
        className={className}
        size={getRightPanelSize(fullWidth, isRightPanelVisible, isEnlarged)}
        sx={{
          position: 'relative',
          [theme.breakpoints.up(MOBILE_BREAKPOINT)]: { paddingLeft: DEFAULT_PADDING_LEFT },
          ...(!fullWidth && displayStyles),
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
  }
);
ResponsiveGridRightPanel.displayName = 'ResponsiveGridRightPanel';

export const ResponsiveGrid = {
  Root: ResponsiveGridRoot,
  Left: ResponsiveGridLeftPanel,
  Right: ResponsiveGridRightPanel,
};
