import { createElement } from "react";

import { CheckboxList } from "./checkbox-list";

/**
 * Class used to handle CheckboxList
 *
 * @export
 * @class CheckboxListAPI
 */
export class CheckboxListAPI {
  listItems: string[];

  checkedItems: number[] = [];

  multiselectFlag: boolean;

  CheckboxList: JSX.Element;

  constructor(list?: string[], multiselect?: boolean, checkedItems?: number[]) {
    this.listItems = list || [];
    this.checkedItems = checkedItems || [];
    this.multiselectFlag = !!multiselect;
    this.CheckboxList = createElement(CheckboxList, {
      listItems: this.listItems,
      multiselect: this.multiselectFlag,
      checkedItems: this.checkedItems,
      setApiCheckedItems: this.setApiCheckedItems,
    });
  }

  setApiCheckedItems = (checkedItems: number[]): void => {
    this.checkedItems = checkedItems;
  };

  getCheckedItems = (): number[] => {
    return this.checkedItems;
  };
}
