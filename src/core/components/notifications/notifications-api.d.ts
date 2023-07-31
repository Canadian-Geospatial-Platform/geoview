import { NotificationType } from '@/api/events/payloads';
export type NotificationDetailsType = {
    notificationType: NotificationType;
    message: string;
    description?: string;
};
/**
 * API to manage notifications in the notification component
 *
 * @exports
 * @class
 */
export declare class NotificationsApi {
    mapId: string;
    notificationsList: NotificationDetailsType[];
    /**
     * initialize the notifications api
     *
     * @param mapId the id of the map this notifications belongs to
     */
    constructor(mapId: string);
    /**
     * Create a tab on the notifications
     *
     * @param {NotificationDetailsType} notificationProps the properties of the notification to be added
     *
     */
    addNotification: (notificationProps: NotificationDetailsType) => void;
    /**
     * Remove notification by index
     *
     * @param {NotificationDetailsType} notificationProps the properties of the notification to be removed
     */
    removeNotification: (notificationProps: NotificationDetailsType) => void;
}
