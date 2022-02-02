import { CSSProperties } from "react";
import { ButtonGroup as MaterialButtonGroup } from "@material-ui/core";

import { TypeChildren, TypeFunction } from "../../core/types/cgpv-types";

interface IconButtonProps {
  children?: TypeChildren;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  ariaLabel?: string;
  orientation?: "vertical" | "horizontal";
  variant?: "text" | "outlined" | "contained";
}

export const ButtonGroup = (props: IconButtonProps): JSX.Element => {
  const { className, style, children, ariaLabel, variant, orientation } = props;

  return (
    <MaterialButtonGroup
      aria-label={ariaLabel ? ariaLabel : undefined}
      variant={variant ? variant : undefined}
      orientation={orientation ? orientation : undefined}
      style={style ? style : undefined}
      className={className ? className : undefined}
    >
      {children && children}
    </MaterialButtonGroup>
  );
};
