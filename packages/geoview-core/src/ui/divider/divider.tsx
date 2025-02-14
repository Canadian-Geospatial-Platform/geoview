import { memo, useMemo } from 'react';
import { SxProps, Theme, useTheme } from '@mui/material/styles';
import { Divider as MaterialDivider, DividerProps } from '@mui/material';

import { getSxClasses } from '@/ui/divider/divider-style';
import { logger } from '@/core/utils/logger';

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
export const Divider = memo(function Divider(props: TypeDividerProps): JSX.Element {
  logger.logTraceRender('ui/divider/divider');

  // Get constant from props
  const { className = '', style, grow, orientation = 'horizontal', sx, ...rest } = props;

  // Hooks
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // Style
  const dividerOrientation = orientation === 'horizontal' ? sxClasses.horizontal : sxClasses.vertical;
  const sxMerged = { ...(grow ? sxClasses.grow : {}), ...dividerOrientation, ...sx };

  return <MaterialDivider sx={sxMerged} className={className} style={style} {...rest} />;
});
