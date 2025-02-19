import { Toolbar as MaterialToolbar, ToolbarProps } from '@mui/material';
import { logger } from '@/core/utils/logger';

/**
 * Create a customized Material UI Toolbar component.
 *
 * @component
 * @example
 * ```tsx
 * // Basic usage
 * <Toolbar>
 *   <Typography>Title</Typography>
 * </Toolbar>
 *
 * // With custom styling
 * <Toolbar
 *   sx={{
 *     backgroundColor: 'primary.main',
 *     color: 'primary.contrastText'
 *   }}
 * />
 * ```
 *
 * @param {ToolbarProps} props - All valid Material-UI Toolbar props
 * @returns {JSX.Element} The Toolbar component
 *
 * @see {@link https://mui.com/material-ui/react-app-bar/}
 */
function ToolbarUI(props: ToolbarProps): JSX.Element {
  logger.logTraceRender('ui/toolbar/toolbar');

  return <MaterialToolbar {...props} />;
}

export const Toolbar = ToolbarUI;
