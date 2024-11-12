/**
 * CheckboxList main Props
 */
export interface CheckboxListProps {
    listItems: Array<CheckboxListItem>;
    checkedValues: string[];
    multiselect: boolean;
    onChecked?: (value: string, checked: boolean, allChecked: Array<string>) => void;
}
/**
 * A CheckboxList item
 */
export type CheckboxListItem = {
    display: string;
    value: string;
    contentRight: JSX.Element;
};
/**
 * Main Component
 * @param props Main props for the component
 * @returns JSX.Element The Component
 */
export declare function CheckboxList(props: CheckboxListProps): JSX.Element;
