import { CSSProperties } from "react";
import { ButtonGroup as MaterialButtonGroup } from "@mui/material";

import { TypeChildren, TypeFunction } from "../../core/types/cgpv-types";

/**
 * Button Group properties
 */
interface ButtonGroupProps {
  children?: TypeChildren;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  ariaLabel?: string;
  orientation?: "vertical" | "horizontal";
  variant?: "text" | "outlined" | "contained";
}

/**
 * Create a customized Material UI button group
 *
 * @param {ButtonGroupProps} props the properties passed to the button group element
 * @returns {JSX.Element} the created Button Group element
 */
export const ButtonGroup = (props: ButtonGroupProps): JSX.Element => {
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
