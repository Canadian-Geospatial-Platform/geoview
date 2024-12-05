/* eslint-disable react/require-default-props */
import { SxProps, Theme, useTheme } from '@mui/material/styles';
import { Divider as MaterialDivider, DividerProps } from '@mui/material';

import { getSxClasses } from './divider-style';

/**
 * Properties for the Divider
 */
interface TypeDividerProps extends DividerProps {
  orientation?: 'horizontal' | 'vertical';
  grow?: boolean;
  sx?: SxProps<Theme>;
}

/**
 * Create a customized Material UI Divider
 *
 * @param {TypeDividerProps} props the properties passed to the Divider element
 * @returns {JSX.Element} the created Divider element
 */
export function Divider(props: TypeDividerProps): JSX.Element {
  const { className, style, grow, orientation, sx, ...rest } = props;

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  let dividerOrientation = sxClasses.horizontal;

  if (orientation) {
    dividerOrientation = orientation === 'horizontal' ? sxClasses.horizontal : sxClasses.vertical;
  }

  const sxMerged = { ...(grow ? sxClasses.grow : {}), ...dividerOrientation, ...sx };
  return <MaterialDivider sx={sxMerged} className={`${className ?? ''}`} style={style} {...rest} />;
}
