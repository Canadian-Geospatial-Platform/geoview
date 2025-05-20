import { MapViewer } from '@/geo/map/map-viewer';
import { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { TypeDisplayLanguage } from '@/api/config/types/map-schema-types';
export declare const MapContext: import("react").Context<TypeMapContext>;
/**
 * Type used for the map context
 */
export type TypeMapContext = {
    mapId: string;
    mapFeaturesConfig?: TypeMapFeaturesConfig;
};
/**
 * interface used when passing map features configuration
 */
interface AppStartProps {
    mapFeaturesConfig: TypeMapFeaturesConfig;
    lang: TypeDisplayLanguage;
    onMapViewerInit?: (mapViewer: MapViewer) => void;
}
/**
 * Initialize the app with maps from inline html configs, url params
 */
declare function AppStart(props: AppStartProps): JSX.Element;
export default AppStart;
