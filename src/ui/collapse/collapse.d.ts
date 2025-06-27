import { CollapseProps } from '@mui/material';
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
declare function CollapseUI(props: CollapseProps): JSX.Element;
export declare const Collapse: typeof CollapseUI;
export {};
//# sourceMappingURL=collapse.d.ts.map