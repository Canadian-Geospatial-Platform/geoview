import { TypeLegendLayerIcons } from '../types';
export declare function useLegendHelpers(mapId: string): {
    populateLegendStoreWithFakeData: () => void;
    getLayerIconImage: (path: string) => TypeLegendLayerIcons | undefined;
};
