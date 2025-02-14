import { memo } from 'react';
import { Badge as MaterialBadge, BadgeProps } from '@mui/material';
import { logger } from '@/core/utils/logger';

/**
 * Create a customized Material UI Badge component.
 * This is a simple wrapper around MaterialABadge that maintains
 * full compatibility with Material-UI's Badge props.
 *
 * @param {BadgeProps} props - All valid Material-UI Badge props
 * @returns {JSX.Element} The Badge component
 */
export const Badge = memo(function Badge(props: BadgeProps): JSX.Element {
  logger.logTraceRender('ui/badge/badge');

  return <MaterialBadge {...props} />;
});
