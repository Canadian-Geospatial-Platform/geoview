import { createElement } from 'react';

import { api } from '../../api/api';
import { EVENT_NAMES } from '../../api/event';
import { CheckboxListAPI } from './checkbox-list';
import { TypePanelProps } from '../../types/cgpv-types';

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

    checkboxListAPI?: CheckboxListAPI;

    /**
     * Initialize a new panel
     *
     * @param panel the passed in panel properties when panel is created
     * @param buttonId the button id of the button that will manage the panel
     */
    constructor(panel: TypePanelProps, buttonId: string) {
        this.buttonId = buttonId;
        this.type = panel.type;
        this.title = panel.title;
        this.icon = panel.icon;
        this.content = panel.content !== undefined && panel.content !== null ? panel.content : createElement('div');
        this.status = panel.status !== undefined && panel.status !== null ? panel.status : false;
        this.width = panel.width;
    }

    /**
     * Trigger an event to open the panel
     */
    open = (): void => {
        api.event.emit(EVENT_NAMES.EVENT_PANEL_OPEN, api.selectedMapViewer.id, {
            handlerId: api.selectedMapViewer.id,
            buttonId: this.buttonId,
        });

        this.status = true;
    };

    /**
     * Trigger an event to close the panel
     */
    close = (): void => {
        api.event.emit(EVENT_NAMES.EVENT_PANEL_CLOSE, api.selectedMapViewer.id, {
            handlerId: api.selectedMapViewer.id,
            buttonId: this.buttonId,
        });

        this.status = false;
    };

    /**
     * Add a new action button to the header of the panel before the close button
     *
     * @param {string} id an id for the new action button to be used later to delete this button
     * @param {string} title the title of the action button, will display in the tooltip
     * @param {string | ReactElement | Element} icon the icon of the action button
     * @param {Function} action a function that will be triggered when clicking this action
     * @returns {Panel} the panel
     */
    addActionButton = (id: string, title: string, icon: string | React.ReactElement | Element, action: () => void): Panel => {
        api.event.emit(EVENT_NAMES.EVENT_PANEL_ADD_ACTION, api.selectedMapViewer.id, {
            handlerId: api.selectedMapViewer.id,
            buttonId: this.buttonId,
            actionButton: {
                id: `${this.buttonId}_${id}`,
                title,
                icon,
                action,
            },
        });

        return this;
    };

    /**
     * Create a check list that can be used as a content
     *
     * @param {String[]} elements of the check list the content to update to
     *
     * @returns {CheckboxList} the check list
     */
    attachCheckBoxList = (listItems: string[], multiselectFlag?: boolean, checkedItems?: number[]): void => {
        if (this.checkboxListAPI) delete this.checkboxListAPI;
        this.checkboxListAPI = new CheckboxListAPI(listItems, multiselectFlag, checkedItems);
        this.changeContent(this.checkboxListAPI.CheckboxList);
    };

    /**
     * Change the content of the panel
     *
     * @param {React Element} content the content to update to
     *
     * @returns {Panel} this panel
     */
    changeContent = (content: React.ReactNode | Element): Panel => {
        this.content = content;

        api.event.emit(EVENT_NAMES.EVENT_PANEL_CHANGE_CONTENT, api.selectedMapViewer.id, {
            handlerId: api.selectedMapViewer.id,
            buttonId: this.buttonId,
            content,
        });

        return this;
    };

    /**
     * Remove action button
     *
     * @param {string} id the id of the action button to be removed
     * @returns {Panel} this panel
     */
    removeActionButton = (id: string): Panel => {
        api.event.emit(EVENT_NAMES.EVENT_PANEL_REMOVE_ACTION, api.selectedMapViewer.id, {
            handlerId: api.selectedMapViewer.id,
            buttonId: this.buttonId,
            actionButtonId: `${this.buttonId}_${id}`,
        });

        return this;
    };
}
