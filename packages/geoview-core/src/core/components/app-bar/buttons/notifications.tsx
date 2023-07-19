import { MouseEventHandler } from 'react';
import { IconButton, NotificationsIcon, Badge } from '../../../../ui';

/**
 * Interface used for notification button properties
 */
interface NotificationsProps {
  className?: string | undefined;
  notificationsCount: number;
  openPopover: MouseEventHandler<HTMLButtonElement>;
}

/**
 * default properties values
 */
const defaultProps = {
  className: '',
};

/**
 * Notification PNG Button component
 *
 * @returns {JSX.Element} the notification button
 */
export default function Notifications(props: NotificationsProps): JSX.Element {
  const { className, openPopover, notificationsCount } = props;

  return (
    <Badge badgeContent={notificationsCount} color="error">
      <IconButton
        id="notification"
        tooltip="appbar.notifications"
        tooltipPlacement="bottom-end"
        onClick={openPopover}
        className={className}
      >
        <NotificationsIcon />
      </IconButton>
    </Badge>
  );
}

Notifications.defaultProps = defaultProps;
