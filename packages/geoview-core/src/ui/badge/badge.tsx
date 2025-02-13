import { memo } from 'react';
import { Badge as MaterialBadge, BadgeProps } from '@mui/material';
import { logger } from '@/core/utils/logger';

/**
 * Create a badge component
 *
 * @param {BadgeProps} props badge properties
 * @returns {JSX.Element} returns badge component
 */
export const Badge = memo(function Badge(props: BadgeProps): JSX.Element {
  logger.logTraceRender('ui/badge/badge');

  return <MaterialBadge {...props} />;
});
