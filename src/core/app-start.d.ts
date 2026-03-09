import type { i18n } from 'i18next';
import type { MapViewer } from '@/geo/map/map-viewer';
export declare const MapContext: import("react").Context<TypeMapContext>;
/**
 * Type used for the map context
 */
export type TypeMapContext = {
    mapId: string;
};
/**
 * interface used when passing map features configuration
 */
interface AppStartProps {
    mapViewer: MapViewer;
    i18nLang: i18n;
}
/**
 * Initialize the app with maps from inline html configs, url params
 */
declare function AppStart(props: AppStartProps): JSX.Element;
export default AppStart;
//# sourceMappingURL=app-start.d.ts.map