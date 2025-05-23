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

// Constants outside component to prevent recreating every render
const PADDING = '0 12px 12px 12px';
const MOBILE_BREAKPOINT = 'md';
const DEFAULT_PADDING_LEFT = '1rem';

// Panel size configurations
// Define the base breakpoint sizes without xs since it's common
type BaseBreakpointSize = 'sm' | 'md' | 'lg' | 'xl';

// PanelSize type that ensures xs is always included
type PanelSize = { xs: number } & Record<string, number>;

// Panel configuration type
type PanelConfig = {
  normal: Partial<Record<BaseBreakpointSize, number>>;
  enlarged: Partial<Record<BaseBreakpointSize, number>>;
};

// Constants with correct typing
const PANEL_SIZES = {
  default: { xs: 12 } as PanelSize,
  left: {
    normal: { md: 4, lg: 4 },
    enlarged: { md: 2, lg: 1.25 },
  } as PanelConfig,
  right: {
    normal: { md: 8, lg: 8 },
    enlarged: { md: 10, lg: 10.75 },
  } as PanelConfig,
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

const usePanelSize = (fullWidth: boolean, isRightPanelVisible: boolean, isEnlarged: boolean): { left: PanelSize; right: PanelSize } => {
  return useMemo(
    () => ({
      left: getLeftPanelSize(fullWidth, isRightPanelVisible, isEnlarged),
      right: getRightPanelSize(fullWidth, isRightPanelVisible, isEnlarged),
    }),
    [fullWidth, isRightPanelVisible, isEnlarged]
  );
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
 * A responsive grid panel component that can be used as either a left or right panel.
 * It handles responsive behavior and visibility based on screen size and panel state.
 *
 * @param {Object} props - The component props
 * @param {ReactNode} props.children - The content to be rendered inside the panel
 * @param {string} [props.className=''] - Additional CSS class names
 * @param {boolean} [props.isRightPanelVisible=false] - Controls the visibility of the right panel
 * @param {SxProps} [props.sxProps={}] - MUI System props for custom styling
 * @param {boolean} props.isEnlarged - Whether the panel is in enlarged state
 * @param {boolean} [props.fullWidth=false] - Whether the panel should take full width
 * @param {boolean} props.isLeftPanel - Determines if this is a left panel (true) or right panel (false)
 * @param {Ref} ref - Forward ref for the Grid component
 * @returns {JSX.Element} A responsive grid panel component
 */
const ResponsiveGridPanel = forwardRef(
  (
    {
      children,
      className = '',
      isRightPanelVisible = false,
      sxProps = {},
      isEnlarged,
      fullWidth = false,
      isLeftPanel,
      ...rest
    }: ResponsiveGridPanelProps & { isLeftPanel: boolean },
    ref
  ) => {
    const theme = useTheme();

    const displayStyles = useMemo(
      () => ({
        [theme.breakpoints.down(MOBILE_BREAKPOINT)]: {
          // eslint-disable-next-line no-nested-ternary
          display: isLeftPanel ? (isRightPanelVisible ? 'none' : 'block') : !isRightPanelVisible ? 'none' : 'flex',
        },
      }),
      [isRightPanelVisible, theme.breakpoints, isLeftPanel]
    );

    const size = usePanelSize(fullWidth, isRightPanelVisible, isEnlarged);

    return (
      <Grid
        className={className}
        size={isLeftPanel ? size.left : size.right}
        sx={{
          ...(isLeftPanel
            ? {}
            : {
                position: 'relative',
                [theme.breakpoints.up(MOBILE_BREAKPOINT)]: {
                  paddingLeft: DEFAULT_PADDING_LEFT,
                },
              }),
          ...sxProps,
          ...(!fullWidth && displayStyles),
          ...(fullWidth && {
            // eslint-disable-next-line no-nested-ternary
            display: isLeftPanel ? (isRightPanelVisible ? 'none' : 'block') : !isRightPanelVisible ? 'none' : 'flex',
          }),
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
ResponsiveGridPanel.displayName = 'ResponsiveRightPanel';

const ResponsiveGridLeftPanel = forwardRef((props: ResponsiveGridPanelProps, ref) => (
  <ResponsiveGridPanel {...props} isLeftPanel ref={ref} />
));
ResponsiveGridLeftPanel.displayName = 'ResponsiveGridLeftPanel';

const ResponsiveGridRightPanel = forwardRef((props: ResponsiveGridPanelProps, ref) => (
  <ResponsiveGridPanel {...props} isLeftPanel={false} ref={ref} />
));
ResponsiveGridRightPanel.displayName = 'ResponsiveGridRightPanel';

export const ResponsiveGrid = {
  Root: ResponsiveGridRoot,
  Left: ResponsiveGridLeftPanel,
  Right: ResponsiveGridRightPanel,
};
