/** Options for navigating to a tab. */
interface NavigateToTabOptions {
    /** The layer path to select after navigation (optional) */
    layerPath?: string;
    /** Delay before executing post-navigation actions in ms (default: 350) */
    delay?: number;
}
/**
 * Custom hook for navigating to footer or appbar tabs with common functionality.
 *
 * Handles opening the tab, collapsing/expanding footer, and scrolling behavior.
 */
export declare function useNavigateToTab(tabId: string, onNavigate?: (mapId: string, layerPath: string) => void): (options?: NavigateToTabOptions) => void;
export {};
//# sourceMappingURL=use-navigate-to-tab.d.ts.map