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
  const sxClasses = getSxClasses(sxtheme);

  let dividerOrientation = sxClasses.horizontal;

  if (orientation) {
    dividerOrientation = orientation === 'horizontal' ? sxClasses.horizontal : sxClasses.vertical;
  }

  return <MaterialDivider sx={{ ...(grow ? sxClasses.grow : {}), ...dividerOrientation }} className={`${className ?? ''}`} style={style} />;
}
