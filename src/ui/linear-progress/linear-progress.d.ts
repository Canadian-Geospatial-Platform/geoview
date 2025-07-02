/**
 * Properties for the Progress Bar component extending Material-UI's LinearProgressProps
 */
interface ProgressbarProps {
    className?: string;
    variant?: 'determinate' | 'indeterminate' | 'buffer' | 'query';
    value?: number;
}
/**
 * Create a customized Material UI Linear Progress Bar component.
 *
 * @component
 * @example
 * ```tsx
 * // Basic usage
 * <ProgressBar />
 *
 * // With determinate value
 * <ProgressBar
 *   variant="determinate"
 *   value={75}
 * />
 *
 * // With custom styling
 * <ProgressBar
 *   className="custom-progress"
 *   variant="buffer"
 * />
 *
 * // Indeterminate loading
 * <ProgressBar variant="indeterminate" />
 * ```
 *
 * @param {ProgressbarProps} props - The properties passed to the Progress Bar element
 * @returns {JSX.Element} The Progress Bar component
 *
 * @see {@link https://mui.com/material-ui/react-progress/}
 */
declare function ProgressBarUI({ className, variant, value, ...props }: ProgressbarProps): JSX.Element;
export declare const ProgressBar: typeof ProgressBarUI;
export {};
//# sourceMappingURL=linear-progress.d.ts.map