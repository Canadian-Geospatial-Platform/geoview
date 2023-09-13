import { Paper as PaperElement, PaperProps } from '@mui/material';

/**
 * Create a popover component
 *
 * @param {PaperProps} props popover properties
 * @returns {JSX.Element} returns popover component
 */
export function Paper(props: PaperProps): JSX.Element {
  return <PaperElement {...props} />;
}
