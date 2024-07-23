import { CardMedia as MaterialCardMedia, CardMediaProps } from '@mui/material';

/**
 * Properties for the Card Media
 */
interface TypeCardMediaProps extends CardMediaProps {
  alt: string;
  // eslint-disable-next-line react/require-default-props
  click?(): void;
  // eslint-disable-next-line react/require-default-props
  keyDown?(e: unknown): void;
}

/**
 * Create a customized Material UI Card Media
 *
 * @param {TypeCardMediaProps} props the properties passed to the Card Media element
 * @returns {JSX.Element} the created Card Media element
 */
export function CardMedia(props: TypeCardMediaProps): JSX.Element {
  const { sx, src, alt, click, keyDown, ...rest } = props;

  return <MaterialCardMedia component="img" sx={sx} alt={alt} src={src} tabIndex={0} onClick={click} onKeyDown={keyDown} {...rest} />;
}
