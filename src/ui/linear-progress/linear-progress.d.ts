/**
 * Properties for the Progress Bar component.
 *
 * Extends Material-UI's LinearProgress functionality with
 * additional accessibility support.
 */
interface ProgressbarProps {
    className?: string;
    variant?: 'determinate' | 'indeterminate' | 'buffer' | 'query';
    value?: number;
    'aria-label'?: string;
}
/**
 * Material-UI LinearProgress component for progress indication.
 *
 * Wraps Material-UI's LinearProgress to provide horizontal progress bar with
 * multiple variants (determinate, indeterminate, buffer, query). Supports custom
 * values, accessibility labels, and theme-aware styling. All Material-UI
 * LinearProgress props are supported and passed through directly.
 *
 * @param props - ProgressBar configuration (see ProgressbarProps interface)
 * @returns Progress bar component with theme styling
 *
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
 * @see {@link https://mui.com/material-ui/react-progress/}
 */
declare function ProgressBarUI({ className, variant, value, ...props }: ProgressbarProps): JSX.Element;
export declare const ProgressBar: typeof ProgressBarUI;
export {};
//# sourceMappingURL=linear-progress.d.ts.map