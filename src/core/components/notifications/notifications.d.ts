/// <reference types="react" />
export type NotificationDetailsType = {
    key: string;
    notificationType: NotificationType;
    message: string;
    description?: string;
};
export type NotificationType = 'success' | 'error' | 'info' | 'warning';
/**
 * Notification PNG Button component
 *
 * @returns {JSX.Element} the notification button
 */
export default function Notifications(): JSX.Element;
