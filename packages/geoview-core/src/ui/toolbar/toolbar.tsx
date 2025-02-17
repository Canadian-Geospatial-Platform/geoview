import { memo } from 'react';
import { Toolbar as MaterialToolbar, ToolbarProps } from '@mui/material';
import { logger } from '@/core/utils/logger';

/**
 * Create a customized Material UI Toolbar component.
 * This is a simple wrapper around MaterialToolbar that maintains
 * full compatibility with Material-UI's Toolbar props.
 *
 * @param {ToolbarProps} props - All valid Material-UI Toolbar props
 * @returns {JSX.Element} The Toolbar component
 */
export const Toolbar = memo(function Toolbar(props: ToolbarProps): JSX.Element {
  logger.logTraceRender('ui/toolbar/toolbar');

  return <MaterialToolbar {...props} />;
});
