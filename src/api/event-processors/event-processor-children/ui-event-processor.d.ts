import { TypeValidAppBarCoreProps, TypeMapCorePackages } from '@/geo';
import { IUIState } from '@/app';
import { AbstractEventProcessor } from '../abstract-event-processor';
export declare class UIEventProcessor extends AbstractEventProcessor {
    /**
     * Shortcut to get the UI state for a given map id
     * @param {string} mapId The mapId
     * @returns {IUIState} The UI state.
     */
    protected static getUIState(mapId: string): IUIState;
    static getActiveFooterBarTab(mapId: string): string;
    static getAppBarComponents(mapId: string): TypeValidAppBarCoreProps;
    static getCorePackageComponents(mapId: string): TypeMapCorePackages;
    static setActiveFooterBarTab(mapId: string, id: string): void;
}
