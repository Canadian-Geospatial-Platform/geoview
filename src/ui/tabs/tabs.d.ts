/// <reference types="react" />
import { TabsProps, TabProps, BoxProps } from '@mui/material';
declare type TypeChildren = React.ReactNode;
/**
 * Type used for properties of each tab
 */
export declare type TypeTabs = {
    value: number;
    label: string;
    content: TypeChildren | string;
};
/**
 * Tabs ui properties
 */
export interface TypeTabsProps {
    tabs: TypeTabs[];
    boxProps?: BoxProps;
    tabsProps?: TabsProps;
    tabProps?: TabProps;
}
/**
 * Create a tabs ui
 *
 * @param {TypeTabsProps} props properties for the tabs ui
 * @returns {JSX.Element} returns the tabs ui
 */
export declare function Tabs(props: TypeTabsProps): JSX.Element;
export {};
