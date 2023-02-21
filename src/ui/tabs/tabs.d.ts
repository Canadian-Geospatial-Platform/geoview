/// <reference types="react" />
import { TabsProps, TabProps, BoxProps } from '@mui/material';
type TypeChildren = React.ReactNode;
/**
 * Type used for properties of each tab
 */
export type TypeTabs = {
    value: number;
    label: string;
    content: TypeChildren | string;
};
/**
 * Tabs ui properties
 */
export interface TypeTabsProps {
    tabs: TypeTabs[];
    selectedTab?: number;
    boxProps?: BoxProps;
    tabsProps?: TabsProps;
    tabProps?: TabProps;
    rightButtons?: unknown;
    isCollapsed?: boolean;
    handleCollapse?: Function | undefined;
    TabContentVisibilty?: string | undefined;
}
/**
 * Create a tabs ui
 *
 * @param {TypeTabsProps} props properties for the tabs ui
 * @returns {JSX.Element} returns the tabs ui
 */
export declare function Tabs(props: TypeTabsProps): JSX.Element;
export {};
