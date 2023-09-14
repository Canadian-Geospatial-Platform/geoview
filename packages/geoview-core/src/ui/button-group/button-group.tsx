import { ButtonGroup as MaterialButtonGroup, ButtonGroupProps } from '@mui/material';

/**
 * Create a customized Material UI button group
 *
 * @param {ButtonGroupProps} props the properties passed to the button group element
 * @returns {JSX.Element} the created Button Group element
 */
export function ButtonGroup(props: ButtonGroupProps): JSX.Element {
  const { sx, className, classes, style, children, 'aria-label': ariaLabel, variant, orientation } = props;

  return (
    <MaterialButtonGroup
      sx={sx}
      aria-label={ariaLabel}
      variant={variant}
      orientation={orientation}
      style={style}
      className={className}
      classes={classes}
    >
      {children && children}
    </MaterialButtonGroup>
  );
}
