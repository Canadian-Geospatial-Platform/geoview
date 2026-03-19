import type { BadgeProps } from '@mui/material';
import { Badge as MaterialBadge } from '@mui/material';
import { logger } from '@/core/utils/logger';

/**
 * Material-UI Badge component for displaying count badges on content.
 *
 * Wraps Material-UI's Badge to display notification badges, counters, or status
 * indicators on icons, buttons, or other UI elements. All Material-UI Badge props
 * are supported and passed through directly. Useful for showing unread counts,
 * status notifications, or highlighting important information.
 *
 * @param props - Badge configuration (see MUI docs for all available props)
 * @returns Badge component with content and badge content shown
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Badge badgeContent={4}>
 *   <MailIcon />
 * </Badge>
 *
 * // With custom color
 * <Badge
 *   badgeContent={100}
 *   color="secondary"
 *   max={99}
 * >
 *   <NotificationsIcon />
 * </Badge>
 *
 * // With custom styling
 * <Badge
 *   badgeContent={4}
 *   sx={{
 *     '& .MuiBadge-badge': {
 *       backgroundColor: 'custom.main'
 *     }
 *   }}
 * >
 *   <IconButton>
 *     <MessageIcon />
 *   </IconButton>
 * </Badge>
 * ```
 *
 * @see {@link https://mui.com/material-ui/api/badge/}
 */
function BadgeUI(props: BadgeProps): JSX.Element {
  logger.logTraceRenderDetailed('ui/badge/badge');

  return <MaterialBadge {...props} />;
}

export const Badge = BadgeUI;
