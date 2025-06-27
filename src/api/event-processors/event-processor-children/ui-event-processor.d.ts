import { TypeMapCorePackages, TypeValidAppBarCoreProps, TypeValidFooterBarTabsCoreProps } from '@/api/config/types/map-schema-types';
import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';
import { IUIState, ActiveAppBarTabType } from '@/core/stores/store-interface-and-intial-values/ui-state';
export declare class UIEventProcessor extends AbstractEventProcessor {
    /**
     * Shortcut to get the UI state for a given map id
     * @param {string} mapId The mapId
     * @returns {IUIState} The UI state.
     */
    protected static getUIStateProtected(mapId: string): IUIState;
    static getActiveFooterBarTab(mapId: string): string;
    static getFooterBarComponents(mapId: string): TypeValidFooterBarTabsCoreProps[];
    static getAppBarComponents(mapId: string): TypeValidAppBarCoreProps[];
    static getCorePackageComponents(mapId: string): TypeMapCorePackages;
    static getFooterBarIsCollapsed(mapId: string): boolean;
    static hideTab(mapId: string, tab: string): void;
    static showTab(mapId: string, tab: string): void;
    static setActiveFooterBarTab(mapId: string, id: string): void;
    static setActiveAppBarTab(mapId: string, tabId: string, tabGroup: string, isOpen: boolean, isFocusTrapped: boolean): void;
    static getActiveAppBarTab(mapId: string): ActiveAppBarTabType;
    static setFooterBarIsCollapsed(mapId: string, collapsed: boolean): void;
}
//# sourceMappingURL=ui-event-processor.d.ts.map