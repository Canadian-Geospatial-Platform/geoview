import { GeoviewStoreType } from '@/core/stores/geoview-store';
import { AbstractEventProcessor } from '../abstract-event-processor';
import { TypeValidAppBarCoreProps, TypeMapCorePackages } from '@/geo';
export declare class UIEventProcessor extends AbstractEventProcessor {
    onInitialize(store: GeoviewStoreType): void;
    static getActiveFooterBarTab(mapId: string): string;
    static getAppBarComponents(mapId: string): TypeValidAppBarCoreProps;
    static getCorePackageComponents(mapId: string): TypeMapCorePackages;
    static setActiveFooterBarTab(mapId: string, id: string): void;
}
