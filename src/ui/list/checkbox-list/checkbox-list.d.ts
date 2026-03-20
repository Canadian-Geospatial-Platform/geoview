/**
 * Configuration properties for the CheckboxList component.
 *
 * Defines structure for checkbox list with single or multi-select support and
 * optional callback when selections change.
 */
export interface CheckboxListProps {
    listItems: Array<CheckboxListItem>;
    checkedValues: string[];
    multiselect: boolean;
    onChecked?: (value: string, checked: boolean, allChecked: Array<string>) => void;
}
/**
 * Individual checkbox list item structure.
 */
export type CheckboxListItem = {
    display: string;
    value: string;
    contentRight: JSX.Element;
};
/**
 * CheckboxList component for multi/single select checkbox collections.
 *
 * Provides a customizable list of checkboxes with single or multi-select modes.
 * Manages internal state of checked items and notifies parent via onChecked callback
 * when selections change. Designed for presenting multiple selectable options with
 * optional content on the right side of each item.
 *
 * @deprecated This component is not currently used. Consider using Material-UI's
 * FormGroup or FormControlLabel components directly for new implementations.
 *
 * @param props - CheckboxList configuration (see CheckboxListProps interface)
 * @returns CheckboxList component with selectable checkbox items
 */
declare function CheckboxListUI(props: CheckboxListProps): JSX.Element;
export declare const CheckboxList: typeof CheckboxListUI;
export {};
//# sourceMappingURL=checkbox-list.d.ts.map