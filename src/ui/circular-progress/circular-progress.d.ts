import { CSSProperties } from 'react';
import { SxProps, Theme } from '@mui/material/styles';
import { CircularProgressProps } from '@mui/material';
/**
 * Circular Progress Properties
 */
export interface CircularProgressPropsExtend extends CircularProgressProps {
    isLoaded: boolean;
    style?: CSSProperties;
    sx?: SxProps<Theme>;
}
/**
 * A customized Material UI Circular Progress component with fade animation.
 *
 * @component
 * @example
 * ```tsx
 * // Basic usage with loading state
 * <CircularProgress isLoaded={false} />
 *
 * // With custom size and color
 * <CircularProgress
 *   isLoaded={false}
 *   size={40}
 *   color="secondary"
 * />
 *
 * // With custom styling
 * <CircularProgress
 *   isLoaded={false}
 *   sx={{
 *     color: 'primary.main',
 *     position: 'absolute'
 *   }}
 * />
 *
 * // With custom thickness
 * <CircularProgress
 *   isLoaded={false}
 *   thickness={4}
 *   size={50}
 * />
 * ```
 *
 * @param {CircularProgressPropsExtend} props - The properties for the CircularProgress component
 * @returns {JSX.Element} A rendered CircularProgress component
 *
 * @note For performance optimization in cases of frequent parent re-renders,
 * consider wrapping this component with React.memo at the consumption level.
 *
 * @see {@link https://mui.com/material-ui/react-progress/}
 */
declare function CircularProgressUI(props: CircularProgressPropsExtend): JSX.Element;
export declare const CircularProgress: typeof CircularProgressUI;
export {};
//# sourceMappingURL=circular-progress.d.ts.map