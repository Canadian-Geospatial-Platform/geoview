/* eslint-disable react/require-default-props */
import { CardMedia as MaterialCardMedia, CardMediaProps } from '@mui/material';

/**
 * Properties for the Card Media
 */
interface TypeCardMediaProps extends CardMediaProps {
  alt: string;
  click?(): void;
  keyDown?(e: unknown): void;
}

/**
 * Create a customized Material UI Card Media
 *
 * @param {TypeCardMediaProps} props the properties passed to the Card Media element
 * @returns {JSX.Element} the created Card Media element
 */
export function CardMedia(props: TypeCardMediaProps): JSX.Element {
  const { sx, src, alt, click, keyDown } = props;

  return <MaterialCardMedia component="img" sx={sx} alt={alt} src={src} tabIndex={0} onClick={click} onKeyDown={keyDown} />;
}
