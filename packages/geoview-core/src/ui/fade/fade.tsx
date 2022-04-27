import { Fade as MaterialFade } from '@mui/material';

import { TypeFadeProps } from '../../core/types/cgpv-types';

/**
 * Create a customized Material UI Fade
 *
 * @param {TypeFadeProps} props the properties passed to the Fade element
 * @returns {JSX.Element} the created Fade element
 */
export function Fade(props: TypeFadeProps): JSX.Element {
  const { in: fadeIn, children } = props;

  return <MaterialFade in={fadeIn}>{children && children}</MaterialFade>;
}
