import type { i18n } from 'i18next';
import type { MapViewer } from '@/geo/map/map-viewer';
/** Create contexts for the map, layer controller, and UI controller */
export declare const StoreContext: import("react").Context<string | undefined>;
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