/**
 * Properties for the Accordion element
 */
interface ProgressbarProps {
    className?: string;
    /**
     * The variant to use.
     */
    variant?: 'determinate' | 'indeterminate' | 'buffer' | 'query';
    /**
     * The value of the progress indicator for the determinate and buffer variants.
     * Value between 0 and 100.
     */
    value?: number;
}
/**
 * Create a customized Progress bar UI
 *
 * @param {ProgressbarProps} props the properties passed to the element
 * @returns {JSX.Element} the created element
 */
export declare function ProgressBar({ className, variant, value, ...rest }: ProgressbarProps): JSX.Element;
export {};
/**
 * Example of usage by application code
 * <ProgressBar variant='determinate' value={progress}></ProgressBar>
 */
