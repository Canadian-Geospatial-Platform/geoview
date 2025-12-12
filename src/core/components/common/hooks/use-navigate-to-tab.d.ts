/**
 * Options for navigating to a tab
 */
interface NavigateToTabOptions {
    /** The layer path to select after navigation (optional) */
    layerPath?: string;
    /** Delay before executing post-navigation actions in ms (default: 350) */
    delay?: number;
}
/**
 * Custom hook for navigating to footer or appbar tabs with common functionality
 * Handles opening the tab, collapsing/expanding footer, and scrolling behavior
 *
 * @param {string} tabId - The ID of the tab to navigate to (e.g., 'layers', 'data-table', 'time-slider-panel')
 * @param {(layerPath: string) => void} [onNavigate] - Optional callback to execute after navigation (e.g., setSelectedLayerPath)
 * @returns {Function} Navigate function that can be called with optional NavigateToTabOptions
 *
 * @example
 * // Simple usage - navigate to layers tab
 * const navigateToLayers = useNavigateToTab('layers');
 * navigateToLayers();
 *
 * @example
 * // With layer selection
 * const { setSelectedLayerPath } = useLayerStoreActions();
 * const navigateToLayers = useNavigateToTab('layers', setSelectedLayerPath);
 * navigateToLayers({ layerPath: 'layer/path' });
 *
 * @example
 * // With custom options
 * const navigateToDataTable = useNavigateToTab('data-table', setDataTableSelectedLayerPath);
 * navigateToDataTable({
 *   layerPath: 'layer/path',
 *   delay: 500
 * });
 */
export declare function useNavigateToTab(tabId: string, onNavigate?: (layerPath: string) => void): (options?: NavigateToTabOptions) => void;
export {};
//# sourceMappingURL=use-navigate-to-tab.d.ts.map