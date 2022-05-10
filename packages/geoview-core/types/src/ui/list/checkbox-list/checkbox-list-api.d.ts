/// <reference types="react" />
/**
 * Class used to handle CheckboxList
 *
 * @export
 * @class CheckboxListAPI
 */
export declare class CheckboxListAPI {
    listItems: string[];
    checkedItems: number[];
    multiselectFlag: boolean;
    CheckboxList: JSX.Element;
    constructor(list?: string[], multiselect?: boolean, checkedItems?: number[]);
    setApiCheckedItems: (checkedItems: number[]) => void;
    getCheckedItems: () => number[];
}
