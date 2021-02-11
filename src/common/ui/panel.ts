import { api } from '../../api/api';
import { EVENT_NAMES } from '../../api/event';

/**
 * constant that defines the panel types
 */
export const PANEL_TYPES = {
    APPBAR: 'appbar',
    NAVBAR: 'navbar',
};

/**
 * Interface for the panel properties used when creating a new panel
 */
export interface PanelProps {
    // panel type (appbar, navbar)
    type?: string;
    // panel open status (open/closed)
    status?: boolean;
    // width of the panel
    width: string | number;
    // panel header icon
    icon: React.ReactNode | Element;
    // panel header title
    title: string;
    // panel body content
    content: React.ReactNode | Element;
}

/**
 * Class used to handle creating a new panel
 *
 * @export
 * @class Panel
 */
export class Panel {
    // panel type (appbar, navbar)
    type: string | undefined;

    // panel open status (open/closed)
    status: boolean | undefined;

    // width of the panel
    width: string | number;

    // panel header icon
    icon: React.ReactNode | Element;

    // panel header title
    title: string;

    // panel body content
    content: React.ReactNode | Element;

    // the linked button id that will open/close the panel
    buttonId: string;

    /**
     * Initialize a new panel
     *
     * @param panel the passed in panel properties when panel is created
     * @param buttonId the button id of the button that will manage the panel
     */
    constructor(panel: PanelProps, buttonId: string) {
        this.buttonId = buttonId;
        this.type = panel.type;
        this.title = panel.title;
        this.icon = panel.icon;
        this.content = panel.content;
        this.status = panel.status;
        this.width = panel.width;
    }

    /**
     * Trigger an event to open the panel
     */
    open = (): void => {
        api.event.emit(EVENT_NAMES.EVENT_PANEL_OPEN, api.selectedMapInstance.id, {
            handlerId: api.selectedMapInstance.id,
            buttonId: this.buttonId,
        });
    };

    /**
     * Trigger an event to close the panel
     */
    close = (): void => {
        api.event.emit(EVENT_NAMES.EVENT_PANEL_CLOSE, api.selectedMapInstance.id, {
            handlerId: api.selectedMapInstance.id,
            buttonId: this.buttonId,
        });
    };
}
