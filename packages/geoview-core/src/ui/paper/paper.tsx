import { Paper as MaterialPaper, PaperProps } from '@mui/material';

/**
 * Create a paper component
 *
 * @param {PaperProps} props paper properties
 * @returns {JSX.Element} returns paper component
 */
export function Paper(props: PaperProps): JSX.Element {
  return <MaterialPaper {...props} />;
}
