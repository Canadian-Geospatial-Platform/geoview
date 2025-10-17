import type { Size } from 'ol/size';
import type { TabsProps, TabProps, BoxProps } from '@mui/material';
import type { TypeContainerBox } from '@/core/types/global-types';
/**
 * Type used for properties of each tab
 */
export type TypeTabs = {
    id: string;
    value: number;
    label: string;
    content?: JSX.Element | string;
    icon?: JSX.Element;
};
/**
 * Type used for focus
 */
type FocusItemProps = {
    activeElementId: string | false;
    callbackElementId: string | false;
};
/**
 * Tabs ui properties
 */
export interface TypeTabsProps {
    shellContainer?: HTMLElement;
    tabs: TypeTabs[];
    selectedTab?: number;
    boxProps?: BoxProps;
    tabsProps?: TabsProps;
    tabProps?: TabProps;
    rightButtons?: unknown;
    isCollapsed?: boolean;
    activeTrap?: boolean;
    TabContentVisibilty?: string | undefined;
    onToggleCollapse?: () => void;
    onSelectedTabChanged?: (tab: TypeTabs) => void;
    onOpenKeyboard?: (uiFocus: FocusItemProps) => void;
    onCloseKeyboard?: () => void;
    containerType?: TypeContainerBox;
    sideAppSize: Size;
    appHeight: number;
    hiddenTabs: string[];
    isFullScreen: boolean;
}
/**
 * Create a tabs ui
 *
 * @param {TypeTabsProps} props properties for the tabs ui
 * @returns {JSX.Element} returns the tabs ui
 */
declare function TabsUI(props: TypeTabsProps): JSX.Element;
export declare const Tabs: typeof TabsUI;
export {};
//# sourceMappingURL=tabs.d.ts.map