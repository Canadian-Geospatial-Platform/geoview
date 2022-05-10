/// <reference types="react" />
/**
 * interface for CheckboxList basic properties
 */
interface CheckboxListType {
    listItems: string[];
    checkedItems: number[];
    multiselect: boolean;
    setApiCheckedItems: (checkedItems: number[]) => void;
}
export declare function CheckboxList({ listItems, multiselect, checkedItems, setApiCheckedItems }: CheckboxListType): JSX.Element;
export {};
