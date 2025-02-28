import { Collapse as MaterialCollapse, CollapseProps } from '@mui/material';
import { logger } from '@/core/utils/logger';

/**
 * Create a customized Material UI Collapse component.
 *
 * @component
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
 * @param {CollapseProps} props - All valid Material-UI Collapse props
 * @returns {JSX.Element} The Collapse component
 *
 * @note For performance optimization in cases of frequent parent re-renders,
 * consider wrapping this component with React.memo at the consumption level.
 *
 * @see {@link https://mui.com/material-ui/react-collapse/|Material-UI Collapse}
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
