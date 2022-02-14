import { Fade as MaterialFade } from "@mui/material";

import { TypeChild } from "../../core/types/cgpv-types";

/**
 * Properties for the Fade element
 */
interface FadeProps {
  fadeIn?: boolean;
  children?: TypeChild;
}

/**
 * Create a customized Material UI Fade
 *
 * @param {FadeProps} props the properties passed to the Fade element
 * @returns {JSX.Element} the created Fade element
 */
export const Fade = (props: FadeProps): JSX.Element => {
  const { fadeIn, children } = props;

  return <MaterialFade in={fadeIn}>{children && children}</MaterialFade>;
};
