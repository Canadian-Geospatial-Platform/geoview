import { LinearProgress as LinearProgressBar } from '@mui/material';

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
export function ProgressBar(props: ProgressbarProps): JSX.Element {
  const { className, variant, value } = props;

  return <LinearProgressBar variant={variant} value={value} className={className} />;
}

/**
 * Default property values
 */
// TODO: Refactor - Remove defaultProps as it's no longer a good practice
ProgressBar.defaultProps = {
  className: '',
  variant: 'indeterminate',
  value: 0,
};

/**
 * Example of usage by application code
 * <ProgressBar variant='determinate' value={progress}></ProgressBar>
 */
