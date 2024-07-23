import { Fade as MaterialFade, FadeProps } from '@mui/material';

/**
 * Create a customized Material UI Fade
 *
 * @param {FadeProps} props the properties passed to the Fade element
 * @returns {JSX.Element} the created Fade element
 */
export function Fade(props: FadeProps): JSX.Element {
  const { in: fadeIn, children, ...rest } = props;

  return (
    <MaterialFade in={fadeIn} {...rest}>
      {children && children}
    </MaterialFade>
  );
}
