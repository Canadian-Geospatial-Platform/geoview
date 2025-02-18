export type NotificationDetailsType = {
    key: string;
    notificationType: NotificationType;
    message: string;
    description?: string;
    count: number;
};
export type NotificationType = 'success' | 'error' | 'info' | 'warning';
/**
 * Notification main component
 *
 * @returns {JSX.Element} the notification component
 */
declare const _default: import("react").NamedExoticComponent<object>;
export default _default;
