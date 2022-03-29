import { ButtonGroup as MaterialButtonGroup } from "@mui/material";

import { TypeButtonGroupProps } from "../../core/types/cgpv-types";

/**
 * Create a customized Material UI button group
 *
 * @param {TypeButtonGroupProps} props the properties passed to the button group element
 * @returns {JSX.Element} the created Button Group element
 */
export function ButtonGroup(props: TypeButtonGroupProps): JSX.Element {
  const { className, style, children, "aria-label": ariaLabel, variant, orientation } = props;

  return (
    <MaterialButtonGroup aria-label={ariaLabel} variant={variant} orientation={orientation} style={style} className={className}>
      {children && children}
    </MaterialButtonGroup>
  );
}
