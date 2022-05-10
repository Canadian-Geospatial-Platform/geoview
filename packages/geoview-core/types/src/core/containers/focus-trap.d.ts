/// <reference types="react" />
/**
 * Interface for the focus trap properties
 */
interface FocusTrapProps {
    id: string;
    callback: (dialogTrap: boolean) => void;
}
/**
 * Create a dialog component to explain to keyboard user how to trigger and remove FocusTrap
 * @param {FocusTrapProps} props the focus trap dialog properties
 * @returns {JSX.Element} the focus trap dialog component
 */
export declare function FocusTrapDialog(props: FocusTrapProps): JSX.Element;
export {};
