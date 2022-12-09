/// <reference types="react" />
type TypeChildren = React.ReactNode;
/**
 * Interface used for the tab panel properties
 */
export interface TypeTabPanelProps {
    index: number;
    value: number;
    children?: TypeChildren;
}
/**
 * Create a tab panel that will be used to display the content of a tab
 *
 * @param {TypeTabPanelProps} props properties for the tab panel
 * @returns {JSX.Element} returns the tab panel
 */
export declare function TabPanel(props: TypeTabPanelProps): JSX.Element;
export {};
