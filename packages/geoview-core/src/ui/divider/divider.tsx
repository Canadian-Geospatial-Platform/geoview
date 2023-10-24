/* eslint-disable react/require-default-props */
import { Divider as MaterialDivider, DividerProps, useTheme } from '@mui/material';
import { getSxClasses } from './divider-style';

/**
 * Properties for the Divider
 */
interface TypeDividerProps extends DividerProps {
  orientation?: 'horizontal' | 'vertical';
  grow?: boolean;
}

/**
 * Create a customized Material UI Divider
 *
 * @param {TypeDividerProps} props the properties passed to the Divider element
 * @returns {JSX.Element} the created Divider element
 */
export function Divider(props: TypeDividerProps): JSX.Element {
  const { className, style, grow, orientation } = props;

  const sxtheme = useTheme();
  const classes = getSxClasses(sxtheme);

  let dividerOrientation = classes.horizontal;

  if (orientation) {
    dividerOrientation = orientation === 'horizontal' ? classes.horizontal : classes.vertical;
  }

  return (
    <MaterialDivider
      sx={{ ...dividerOrientation, ...(grow ? classes.grow : {}) }}
      className={`${className !== undefined ? className : ''}`}
      style={style}
    />
  );
}
