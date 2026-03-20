import type { CSSProperties } from 'react';
import type { SxProps, Theme } from '@mui/material/styles';
import type { CircularProgressProps } from '@mui/material';
/**
 * Circular Progress Properties
 */
export interface CircularProgressPropsExtend extends CircularProgressProps {
    isLoaded: boolean;
    style?: CSSProperties;
    sx?: SxProps<Theme>;
    sxCircular?: SxProps<Theme>;
}
/**
 * Material-UI CircularProgress with fade-in/out animation.
 *
 * Wraps Material-UI's CircularProgress with Fade animation controlled by the
 * `isLoaded` prop. Shows loading spinner when isLoaded is false, fades out when
 * true using theme transitions. All Material-UI CircularProgress props are supported.
 * Useful for displaying loading states with smooth visibility transitions.
 *
 * @param props - CircularProgress configuration (see CircularProgressPropsExtend interface)
 * @returns Fading CircularProgress component showing when not loaded
 *
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
 * @see {@link https://mui.com/material-ui/react-progress/}
 */
declare function CircularProgressUI(props: CircularProgressPropsExtend): JSX.Element;
export declare const CircularProgress: typeof CircularProgressUI;
export {};
//# sourceMappingURL=circular-progress.d.ts.map