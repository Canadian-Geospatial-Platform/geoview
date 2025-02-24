import { CircularProgressProps } from '@mui/material';
/**
 * A customized Material UI Circular Progress Base component.
 *
 * @component
 * @example
 * ```tsx
 * // Basic usage
 * <CircularProgressBase />
 *
 * // With specific value
 * <CircularProgressBase value={75} />
 *
 * // Indeterminate with color
 * <CircularProgressBase
 *   color="secondary"
 *   variant="indeterminate"
 * />
 *
 * // With custom size and thickness
 * <CircularProgressBase
 *   size={60}
 *   thickness={4}
 *   value={80}
 * />
 * ```
 *
 * @param {CircularProgressProps} props - The properties for the CircularProgressBase component
 * @returns {JSX.Element} A rendered CircularProgressBase component
 *
 * @note For performance optimization in cases of frequent parent re-renders,
 * consider wrapping this component with React.memo at the consumption level.
 *
 * @see {@link https://mui.com/material-ui/react-progress/}
 */
declare function CircularProgressBaseUI(props: CircularProgressProps): JSX.Element;
export declare const CircularProgressBase: typeof CircularProgressBaseUI;
export {};
