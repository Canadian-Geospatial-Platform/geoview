import { TypeButtonProps } from '../../types/cgpv-types';

/**
 * Class used to handle creating a new button
 *
 * @export
 * @class Button
 */
export class Button {
    // generated button id
    id: string;

    // button tooltip
    tooltip: string;

    // button icon
    icon: React.ReactNode | Element;

    // optional callback function to run on button click
    callback?: () => void;

    // optional value used to check if the button will be visible on the appbar/navbar (default true)
    visible?: boolean = true;

    /**
     * Initialize a new button
     *
     * @param button the passed in button properties when button is created
     */
    constructor(button: TypeButtonProps) {
        this.id = button.id;
        this.icon = button.icon;
        this.tooltip = button.tooltip;
        this.callback = button.callback;

        this.visible = button.visible !== undefined ? button.visible : true;
    }
}
