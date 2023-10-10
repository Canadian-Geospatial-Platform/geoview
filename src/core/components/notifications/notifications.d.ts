/// <reference types="react" />
import { NotificationType } from '@/api/events/payloads';
export type NotificationDetailsType = {
    key: string;
    notificationType: NotificationType;
    message: string;
    description?: string;
};
/**
 * Notification PNG Button component
 *
 * @returns {JSX.Element} the notification button
 */
export default function Notifications(): JSX.Element;
