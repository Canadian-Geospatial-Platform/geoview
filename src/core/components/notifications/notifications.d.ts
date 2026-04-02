/** Details for a single notification entry. */
export type NotificationDetailsType = {
    /** The unique key for the notification. */
    key: string;
    /** The type of notification. */
    notificationType: NotificationType;
    /** The notification message text. */
    message: string;
    /** Optional extended description. */
    description?: string;
    /** The number of times this notification has occurred. */
    count: number;
};
/** The type of notification severity. */
export type NotificationType = 'success' | 'error' | 'info' | 'warning';
/**
 * Renders the notification panel with a badge, popover, and notification list.
 *
 * Memoized to prevent re-renders triggered by parent updates when the component has no props.
 *
 * @returns The notification component
 */
declare const _default: import("react").NamedExoticComponent<object>;
export default _default;
//# sourceMappingURL=notifications.d.ts.map