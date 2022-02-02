import { CSSProperties } from "react";
import { IconButton as MaterialIconButton } from "@material-ui/core";

import { TypeChildren, TypeFunction } from "../../core/types/cgpv-types";

interface IconButtonProps {
  children?: TypeChildren;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  ariaLabel?: string;
  onClick?: TypeFunction;
}

export const IconButton = (props: IconButtonProps): JSX.Element => {
  const { className, style, children, onClick, ariaLabel } = props;

  return (
    <MaterialIconButton
      aria-label={ariaLabel ? ariaLabel : undefined}
      style={style ? style : undefined}
      className={className ? className : undefined}
      onClick={onClick ? onClick : undefined}
    >
      {children && children}
    </MaterialIconButton>
  );
};
