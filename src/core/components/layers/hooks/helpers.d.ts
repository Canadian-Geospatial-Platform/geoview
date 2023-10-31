import { TypeLegendLayerIcon } from '../types';
export declare function useLegendHelpers(mapId: string): {
    populateLegendStoreWithFakeData: () => void;
    getLayerIconImage: (path: string) => TypeLegendLayerIcon | undefined;
};
