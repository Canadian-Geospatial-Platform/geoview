import type { ReactNode} from 'react';
import { forwardRef, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import type { GridProps, SxProps } from '@/ui';
import { Grid } from '@/ui';

interface ResponsiveGridProps extends GridProps {
  children: ReactNode;
}

interface ResponsiveGridPanelProps extends GridProps {
  children: ReactNode;
  isRightPanelVisible: boolean;
  sxProps?: SxProps;
  isEnlarged: boolean;
  className?: string;
  toggleMode?: boolean;
}

// Constants outside component to prevent recreating every render
const PADDING = '0 6px';

// Panel size configurations
// Define the base breakpoint sizes without xs since it's common
type BaseBreakpointSize = 'sm' | 'md' | 'lg' | 'xl';

// PanelSize type that ensures xs is always included
type PanelSize = { xs: number | 'auto' | 'grow' } & Record<string, number | 'auto' | 'grow'>;

// Panel configuration type
type PanelConfig = {
  normal: Partial<Record<BaseBreakpointSize, number | 'auto' | 'grow'>>;
  enlarged: Partial<Record<BaseBreakpointSize, number | 'auto' | 'grow'>>;
};

// Constants with correct typing
const PANEL_SIZES = {
  default: { xs: 12 } as PanelSize,
  left: {
    normal: { sm: 5, md: 4, lg: 4 },
    enlarged: { sm: 3, md: 2, lg: 1.25 }
  } as PanelConfig,
  right: {
    normal: { sm: 7, md: 8, lg: 8 },
    enlarged: { sm: 9, md: 10, lg: 10.75 },
  } as PanelConfig,
} as const;

/**
 * Get the left panel grid width size
 */
const getLeftPanelSize = (isRightPanelVisible: boolean, isEnlarged: boolean, toggleMode: boolean): PanelSize => {
  if ( toggleMode ) {
    return isRightPanelVisible ? { xs: 'auto' } : { xs: 'grow' };
  }

  return {
    xs: isRightPanelVisible ? 0 : 12,
    ...(isEnlarged ? PANEL_SIZES.left.enlarged : PANEL_SIZES.left.normal),
  };
};

/**
 * Get the right panel grid width size
 */
const getRightPanelSize = (isRightPanelVisible: boolean, isEnlarged: boolean, toggleMode: boolean): PanelSize => {
  if ( toggleMode ) {
    return isRightPanelVisible ? { xs: 'grow' } : { xs: 0 };
  }

  return {
    xs: !isRightPanelVisible ? 0 : 12,
    ...(isEnlarged ? PANEL_SIZES.right.enlarged : PANEL_SIZES.right.normal),
  };
};

const usePanelSize = (isRightPanelVisible: boolean, isEnlarged: boolean, toggleMode: boolean): { left: PanelSize; right: PanelSize } => {
  return useMemo(
    () => ({
      left: getLeftPanelSize(isRightPanelVisible, isEnlarged, toggleMode),
      right: getRightPanelSize(isRightPanelVisible, isEnlarged, toggleMode),
    }),
    [isRightPanelVisible, isEnlarged, toggleMode]
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
 * @param {boolean} props.isLeftPanel - Determines if this is a left panel (true) or right panel (false)
 * @param {boolean} props.toggleMode - Alternate mode for the grid that resizes the left panel based on right panel visibility
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
      isLeftPanel,
      toggleMode = false,
      ...rest
    }: ResponsiveGridPanelProps & { isLeftPanel: boolean },
    ref
  ) => {
    const theme = useTheme();

    const displayStyles = useMemo(
      () => ({
        [theme.breakpoints.down('sm')]: {
          // eslint-disable-next-line no-nested-ternary
          display: isLeftPanel ? (isRightPanelVisible ? 'none' : 'block') : !isRightPanelVisible ? 'none' : 'flex',
        },
      }),
      [isRightPanelVisible, theme.breakpoints, isLeftPanel]
    );

    const size = usePanelSize(isRightPanelVisible, isEnlarged, toggleMode);

    return (
      <Grid
        className={className}
        size={isLeftPanel ? size.left : size.right}
        padding="0 10px"
        sx={{
          ...(isLeftPanel
            ? {}
            : {
                position: 'relative',
              }),
          ...sxProps,
          ...(!toggleMode && displayStyles),
          ...(toggleMode && {
            // eslint-disable-next-line no-nested-ternary
            display: isLeftPanel ? 'flex' : !isRightPanelVisible ? 'none' : 'flex',
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
