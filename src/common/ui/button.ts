/**
 * Interface for the button properties used when creating a new button
 */
export interface ButtonProps {
    // generated button id
    id: string;
    // button tooltip
    tooltip: string;
    // button icon
    icon: React.ReactNode | Element;
    // optional callback function to run on button click
    callback?: () => void;
}

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

    /**
     * Initialize a new button
     *
     * @param button the passed in button properties when button is created
     */
    constructor(button: ButtonProps) {
        this.id = button.id;
        this.icon = button.icon;
        this.tooltip = button.tooltip;
        this.callback = button.callback;
    }
}
