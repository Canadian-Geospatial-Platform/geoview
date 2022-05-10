/// <reference types="react" />
import { CheckboxListAPI } from '../list/checkbox-list/checkbox-list-api';
import { TypePanelProps } from '../../core/types/cgpv-types';
/**
 * Class used to handle creating a new panel
 *
 * @export
 * @class PanelApi
 */
export declare class PanelApi {
    id: string;
    type: string | undefined;
    status: boolean | undefined;
    width: string | number;
    icon: React.ReactNode | Element;
    title: string;
    content: React.ElementType | React.ReactNode | Element;
    buttonId: string;
    mapId: string;
    checkboxListAPI?: CheckboxListAPI;
    /**
     * Initialize a new panel
     *
     * @param {TypePanelProps} panel the passed in panel properties when panel is created
     * @param {string} buttonId the button id of the button that will manage the panel
     * @param {string} mapId the map id that this panel belongs to
     */
    constructor(panel: TypePanelProps, buttonId: string, mapId: string);
    /**
     * Trigger an event to open the panel
     */
    open: () => void;
    /**
     * Close all other panels
     */
    closeAll: () => void;
    /**
     * Trigger an event to close the panel
     */
    close: () => void;
    /**
     * Add a new action button to the header of the panel before the close button
     *
     * @param {string} id an id for the new action button to be used later to delete this button
     * @param {string} title the title of the action button, will display in the tooltip
     * @param {string | ReactElement | Element} icon the icon of the action button
     * @param {Function} action a function that will be triggered when clicking this action
     * @returns {Panel} the panel
     */
    addActionButton: (id: string, title: string, icon: string | React.ReactElement | Element, action: () => void) => PanelApi;
    /**
     * Create a check list that can be used as a content
     *
     * @param {String[]} elements of the check list the content to update to
     *
     * @returns {CheckboxList} the check list
     */
    attachCheckBoxList: (listItems: string[], multiselectFlag?: boolean | undefined, checkedItems?: number[] | undefined) => void;
    /**
     * Change the content of the panel
     *
     * @param {React Element} content the content to update to
     *
     * @returns {Panel} this panel
     */
    changeContent: (content: React.ReactNode | Element) => PanelApi;
    /**
     * Remove action button
     *
     * @param {string} id the id of the action button to be removed
     * @returns {Panel} this panel
     */
    removeActionButton: (id: string) => PanelApi;
}
