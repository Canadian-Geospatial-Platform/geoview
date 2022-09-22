import MaterialFade from '@mui/material/Fade';

import { FadeProps } from '@mui/material';

/**
 * Create a customized Material UI Fade
 *
 * @param {FadeProps} props the properties passed to the Fade element
 * @returns {JSX.Element} the created Fade element
 */
export function Fade(props: FadeProps): JSX.Element {
  const { in: fadeIn, children } = props;

  return <MaterialFade in={fadeIn}>{children && children}</MaterialFade>;
}
