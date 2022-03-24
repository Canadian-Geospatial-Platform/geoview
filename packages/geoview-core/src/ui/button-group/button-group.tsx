import { CSSProperties } from 'react';

import { ButtonGroup as MaterialButtonGroup } from '@mui/material';

import { TypeChildren } from '../../core/types/cgpv-types';

/**
 * Button Group properties
 */
interface ButtonGroupProps {
  children?: TypeChildren;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
  orientation?: 'vertical' | 'horizontal';
  variant?: 'text' | 'outlined' | 'contained';
}

/**
 * Create a customized Material UI button group
 *
 * @param {ButtonGroupProps} props the properties passed to the button group element
 * @returns {JSX.Element} the created Button Group element
 */
export function ButtonGroup(props: ButtonGroupProps): JSX.Element {
  const { className, style, children, ariaLabel, variant, orientation } = props;

  return (
    <MaterialButtonGroup
      aria-label={ariaLabel || undefined}
      variant={variant || undefined}
      orientation={orientation || undefined}
      style={style || undefined}
      className={className || undefined}
    >
      {children && children}
    </MaterialButtonGroup>
  );
}
