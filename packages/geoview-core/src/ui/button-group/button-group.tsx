import { ButtonGroup as MaterialButtonGroup, ButtonGroupProps as MaterialButtonGroupProps } from "@mui/material";

/**
 * Button Group properties
 */
type ButtonGroupProps = MaterialButtonGroupProps;

/**
 * Create a customized Material UI button group
 *
 * @param {ButtonGroupProps} props the properties passed to the button group element
 * @returns {JSX.Element} the created Button Group element
 */
export function ButtonGroup(props: ButtonGroupProps): JSX.Element {
  const { className, style, children, "aria-label": ariaLabel, variant, orientation } = props;

  return (
    <MaterialButtonGroup aria-label={ariaLabel} variant={variant} orientation={orientation} style={style} className={className}>
      {children && children}
    </MaterialButtonGroup>
  );
}
