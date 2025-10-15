import { useMemo } from 'react';
import type { SxProps, Theme } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';
import type { DividerProps } from '@mui/material';
import { Divider as MaterialDivider } from '@mui/material';

import { getSxClasses } from '@/ui/divider/divider-style';
import { logger } from '@/core/utils/logger';

/**
 * Properties for the Divider component extending Material-UI's DividerProps
 */
export interface DividerPropsExtend extends DividerProps {
  orientation?: 'horizontal' | 'vertical';
  grow?: boolean;
  sx?: SxProps<Theme>;
}

/**
 * Create a customized Material UI Divider component.
 *
 * @component
 * @example
 * ```tsx
 * // Basic usage
 * <Divider />
 *
 * // Vertical divider
 * <Divider orientation="vertical" />
 *
 * // Growing divider
 * <Divider grow />
 *
 * // With custom styling
 * <Divider
 *   sx={{
 *     borderColor: 'primary.main',
 *     margin: 2
 *   }}
 * />
 * ```
 *
 * @param {DividerPropsExtend} props - The properties passed to the Divider element
 * @returns {JSX.Element} The Divider component
 *
 * @see {@link https://mui.com/material-ui/react-divider/}
 */
function DividerUI(props: DividerPropsExtend): JSX.Element {
  logger.logTraceRenderDetailed('ui/divider/divider');

  // Get constant from props
  const { className = '', style, grow, orientation = 'horizontal', sx, ...rest } = props;

  // Hooks
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // Style
  const dividerOrientation = orientation === 'horizontal' ? sxClasses.horizontal : sxClasses.vertical;
  const sxMerged = { ...(grow ? sxClasses.grow : {}), ...dividerOrientation, ...sx };

  return <MaterialDivider sx={sxMerged} className={className} style={style} {...rest} />;
}

export const Divider = DividerUI;
