import type { ReactNode} from 'react';
import { forwardRef, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import type { GridProps, SxProps } from '@/ui';
import { Grid } from '@/ui';
import { logger } from '@/core/utils/logger';

/** Properties for the responsive grid root container. */
interface ResponsiveGridProps extends GridProps {
  children: ReactNode;
}

/** Properties for a responsive grid panel (left or right). */
interface ResponsiveGridPanelProps extends GridProps {
  children: ReactNode;
  isRightPanelVisible: boolean;
  sxProps?: SxProps;
  isEnlarged: boolean;
  className?: string;
  toggleMode?: boolean;
}

/** Grid container padding. */
const PADDING = '0 6px';

/** Base breakpoint sizes without xs since it's common. */
type BaseBreakpointSize = 'sm' | 'md' | 'lg' | 'xl';

/** Panel size ensuring xs is always included. */
type PanelSize = { xs: number | 'auto' | 'grow' } & Record<string, number | 'auto' | 'grow'>;

/** Panel configuration for normal and enlarged states. */
type PanelConfig = {
  normal: Partial<Record<BaseBreakpointSize, number | 'auto' | 'grow'>>;
  enlarged: Partial<Record<BaseBreakpointSize, number | 'auto' | 'grow'>>;
};

/** Panel size configurations for default, left, and right panels. */
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
 * Gets the left panel grid width size.
 *
 * @param isRightPanelVisible - Whether the right panel is visible
 * @param isEnlarged - Whether the panel is enlarged
 * @param toggleMode - Whether toggle mode is active
 * @returns The panel size configuration
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
 * Gets the right panel grid width size.
 *
 * @param isRightPanelVisible - Whether the right panel is visible
 * @param isEnlarged - Whether the panel is enlarged
 * @param toggleMode - Whether toggle mode is active
 * @returns The panel size configuration
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

/**
 * Computes memoized left and right panel sizes.
 *
 * @param isRightPanelVisible - Whether the right panel is visible
 * @param isEnlarged - Whether the panel is enlarged
 * @param toggleMode - Whether toggle mode is active
 * @returns The left and right panel size configurations
 */
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
 * Responsive grid container.
 *
 * @param props - Grid container properties
 * @param ref - Forwarded ref for the Grid element
 * @returns The grid container element
 */
const ResponsiveGridRoot = forwardRef(({ children, ...rest }: ResponsiveGridProps, ref) => (
  <Grid component="div" container {...rest} padding={PADDING} ref={ref}>
    {children}
  </Grid>
));
ResponsiveGridRoot.displayName = 'ResponsiveGridRoot';

/**
 * Responsive grid panel used as either a left or right panel.
 *
 * Handles responsive behavior and visibility based on screen size and panel state.
 *
 * @param props - Panel properties including visibility, size, and mode
 * @param ref - Forwarded ref for the Grid element
 * @returns The responsive grid panel element
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
    // Log
    logger.logTraceRender('components/common/responsive-grid > ResponsiveGridPanel');

    const theme = useTheme();

    const memoDisplayStyles = useMemo(
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
          ...(!toggleMode && memoDisplayStyles),
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

/**
 * Left panel wrapper around ResponsiveGridPanel.
 *
 * @param props - Panel properties
 * @param ref - Forwarded ref
 * @returns The left panel element
 */
const ResponsiveGridLeftPanel = forwardRef((props: ResponsiveGridPanelProps, ref) => (
  <ResponsiveGridPanel {...props} isLeftPanel ref={ref} />
));
ResponsiveGridLeftPanel.displayName = 'ResponsiveGridLeftPanel';

/**
 * Right panel wrapper around ResponsiveGridPanel.
 *
 * @param props - Panel properties
 * @param ref - Forwarded ref
 * @returns The right panel element
 */
const ResponsiveGridRightPanel = forwardRef((props: ResponsiveGridPanelProps, ref) => (
  <ResponsiveGridPanel {...props} isLeftPanel={false} ref={ref} />
));
ResponsiveGridRightPanel.displayName = 'ResponsiveGridRightPanel';

/** Responsive grid component with Root, Left, and Right panel slots. */
export const ResponsiveGrid = {
  Root: ResponsiveGridRoot,
  Left: ResponsiveGridLeftPanel,
  Right: ResponsiveGridRightPanel,
};
