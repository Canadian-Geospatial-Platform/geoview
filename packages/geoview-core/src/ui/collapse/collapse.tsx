import type { CollapseProps } from '@mui/material';
import { Collapse as MaterialCollapse } from '@mui/material';
import { logger } from '@/core/utils/logger';

/**
 * Material-UI Collapse component for expandable/collapsible content.
 *
 * Wraps Material-UI's Collapse to provide smooth height-based animation for
 * showing/hiding content. Controls visibility via the `in` prop with optional
 * timeout and unmount behaviors. All Material-UI Collapse props are supported
 * and passed through directly.
 *
 * @param props - Collapse configuration (see MUI docs for all available props)
 * @returns Collapse component with smooth expand/collapse animation
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Collapse in={open}>
 *   <div>Collapsible content</div>
 * </Collapse>
 *
 * // With timeout
 * <Collapse
 *   in={open}
 *   timeout={300}
 * >
 *   <Card>Collapsible card</Card>
 * </Collapse>
 *
 * // With unmount on exit
 * <Collapse
 *   in={open}
 *   unmountOnExit
 * >
 *   <Typography>Content unmounts when collapsed</Typography>
 * </Collapse>
 *
 * // With custom styling
 * <Collapse
 *   in={open}
 *   className="custom-collapse"
 *   style={{ marginTop: 16 }}
 * >
 *   <div>Styled collapse content</div>
 * </Collapse>
 * ```
 *
 * @see {@link https://mui.com/material-ui/react-collapse/}
 */
function CollapseUI(props: CollapseProps): JSX.Element {
  logger.logTraceRenderDetailed('ui/collapse/collapse', props);

  // Get constant from props
  const { children, className, style, timeout, unmountOnExit, ...rest } = props;

  // eslint-disable-next-line react/destructuring-assignment
  const inProp = props.in;

  return (
    <MaterialCollapse
      className={className || ''}
      style={style || undefined}
      in={inProp}
      timeout={timeout}
      unmountOnExit={unmountOnExit}
      {...rest}
    >
      {children !== undefined && children}
    </MaterialCollapse>
  );
}

export const Collapse = CollapseUI;
