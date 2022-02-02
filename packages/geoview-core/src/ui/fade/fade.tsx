import { Fade as MaterialFade } from "@material-ui/core";

import { TypeChild } from "../../core/types/cgpv-types";

interface FadeProps {
  fadeIn?: boolean;
  children?: TypeChild;
}

export const Fade = (props: FadeProps): JSX.Element => {
  const { fadeIn, children } = props;

  return <MaterialFade in={fadeIn}>{children && children}</MaterialFade>;
};
