import type { TabsProps, TabProps, BoxProps } from '@mui/material';
import type { TypeContainerBox } from '@/core/types/global-types';
/** Properties defining a tab and its panel content. */
export type TypeTabs = {
    /** Unique tab identifier. */
    id: string;
    /** Position value used to select the tab. */
    value: number;
    /** Visible tab title. */
    label: string;
    /** Optional tab panel content. */
    content?: JSX.Element | string;
    /** Optional icon shown beside the tab title. */
    icon?: JSX.Element;
};
/** Element IDs used to manage tab panel focus. */
type FocusItemProps = {
    /** ID of the active focusable element. */
    activeElementId: string | false;
    /** ID of the element to receive focus when the trap closes. */
    callbackElementId: string | false;
};
/** Properties for the tabs UI component. */
export interface TypeTabsProps {
    /** The map identifier associated with the tabs component. */
    mapId: string;
    /** Optional container used to portal menus within fullscreen content. */
    shellContainer?: HTMLElement;
    /** Tabs displayed in the component. */
    tabs: TypeTabs[];
    /** Index of the selected tab, synchronized when the prop changes. */
    selectedTab?: number;
    /** Props applied to the tab container. */
    boxProps?: BoxProps;
    /** Props applied to the MUI Tabs component. */
    tabsProps?: TabsProps;
    /** Props applied to each MUI Tab. */
    tabProps?: TabProps;
    /** Optional content rendered beside the tabs. */
    rightButtons?: unknown;
    /** Whether the tab panel is collapsed. */
    isCollapsed?: boolean;
    /** Whether keyboard focus is trapped in the panel. */
    activeTrap?: boolean;
    /** Visibility value applied to the tab content. */
    TabContentVisibilty?: string;
    /** Callback invoked when the panel collapse state changes. */
    onToggleCollapse?: () => void;
    /** Callback invoked when a tab is selected. */
    onSelectedTabChanged?: (tab: TypeTabs) => void;
    /** Callback invoked when the tab header is clicked. */
    onHeaderClick?: () => void;
    /** Callback invoked when keyboard focus enters the panel. */
    onOpenKeyboard?: (uiFocus: FocusItemProps) => void;
    /** Callback invoked when keyboard focus leaves the panel. */
    onCloseKeyboard?: () => void;
    /** Type of container holding the tab panel. */
    containerType: TypeContainerBox;
    /** Available height for the application layout. */
    appHeight: string;
    /** Tab IDs that should not be displayed. */
    hiddenTabs: string[];
    /** Whether the viewer is in fullscreen mode. */
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
 *   mapId="mapWM"
 *   tabs={[
 *     { id: 'tab1', value: 0, label: 'Tab 1', content: <div>Content 1</div> },
 *     { id: 'tab2', value: 1, label: 'Tab 2', content: <div>Content 2</div> }
 *   ]}
 *   selectedTab={0}
 *   containerType="panel"
 *   appHeight="100vh"
 *   hiddenTabs={[]}
 *   isFullScreen={false}
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