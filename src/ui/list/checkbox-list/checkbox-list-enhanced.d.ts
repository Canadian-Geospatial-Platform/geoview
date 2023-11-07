/// <reference types="react" />
/**
 * interface for CheckboxList basic properties
 */
export interface CheckboxListEnhancedType {
    listItems: Array<CheckboxListEnhancedItem>;
    checkedValues: string[];
    multiselect: boolean;
    checkedCallback: (value: string, checked: boolean, allChecked: Array<string>) => void;
}
export type CheckboxListEnhancedItem = {
    display: string;
    value: string;
    contentRight: JSX.Element;
};
export declare function CheckboxListEnhanced(props: CheckboxListEnhancedType): JSX.Element;
