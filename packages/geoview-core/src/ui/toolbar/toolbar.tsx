import type { ToolbarProps } from '@mui/material';
import { Toolbar as MaterialToolbar } from '@mui/material';
import { logger } from '@/core/utils/logger';

/**
 * Material-UI Toolbar component for app bar content.
 *
 * Wraps Material-UI's Toolbar for consistent spacing and alignment of content within AppBars.
 * Automatically handles responsive padding and provides flex layout for organizing elements.
 * All Material-UI Toolbar props are supported.
 *
 * @param props - Toolbar configuration (see ToolbarProps)
 * @returns Toolbar component with responsive spacing
 *
 * @example
 * ```tsx
 * <Toolbar>
 *   <Typography>Title</Typography>
 * </Toolbar>
 *
 * <Toolbar sx={{ backgroundColor: 'primary.main' }}>
 *   <IconButton>Menu</IconButton>
 * </Toolbar>
 * ```
 *
 * @see {@link https://mui.com/material-ui/react-app-bar/}
 */
function ToolbarUI(props: ToolbarProps): JSX.Element {
  logger.logTraceRenderDetailed('ui/toolbar/toolbar');

  return <MaterialToolbar {...props} />;
}

export const Toolbar = ToolbarUI;
