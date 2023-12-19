import { GeoviewStoreType } from '@/core/stores/geoview-store';
import { AbstractEventProcessor } from '../abstract-event-processor';
import { TypeAppBarProps, TypeMapCorePackages } from '@/geo';
export declare class UIEventProcessor extends AbstractEventProcessor {
    onInitialize(store: GeoviewStoreType): void;
    static getAppBarComponents(mapId: string): TypeAppBarProps;
    static getCorePackageComponents(mapId: string): TypeMapCorePackages;
    static setActiveFooterTab(mapId: string, id: string): void;
}
