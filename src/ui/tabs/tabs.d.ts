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
    containerType: TypeContainerBox;
    appHeight: string;
    hiddenTabs: string[];
    isFullScreen: boolean;
}
/**
 * Custom tabbed interface component with responsive mobile support.
 *
 * Provides a fully accessible tabs UI with keyboard navigation, focus management,
 * and mobile dropdown support. Handles both horizontal and vertical layouts, with
 * content visibility control and escape key handling for integration with panels.
 *
 * @param props - Tabs configuration (see TypeTabsProps interface)
 * @returns Tabs component with responsive tab switching and panel content
 *
 * @example
 * ```tsx
 * <Tabs
 *   tabs={[
 *     { id: 'tab1', value: 0, label: 'Tab 1', content: <div>Content 1</div> },
 *     { id: 'tab2', value: 1, label: 'Tab 2', content: <div>Content 2</div> }
 *   ]}
 *   selectedTab={0}
 *   containerType="panel"
 *   appHeight="100vh"
 *   onSelectedTabChanged={handleTabChange}
 * />
 * ```
 *
 * @see {@link https://mui.com/material-ui/react-tabs/}
 */
declare function TabsUI(props: TypeTabsProps): JSX.Element;
export declare const Tabs: typeof TabsUI;
export {};
//# sourceMappingURL=tabs.d.ts.map