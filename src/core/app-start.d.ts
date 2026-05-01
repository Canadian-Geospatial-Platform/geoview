import type { i18n } from 'i18next';
import type { MapViewer } from '@/geo/map/map-viewer';
/** Create contexts for the map, layer controller, and UI controller */
export declare const StoreContext: import("react").Context<string | undefined>;
/** Defines the props for the AppStart component. */
interface AppStartProps {
    /** The map viewer instance to initialize. */
    mapViewer: MapViewer;
    /** The i18n language instance for internationalization. */
    i18nLang: i18n;
}
/**
 * Initializes the app with maps from inline HTML configs and URL params.
 *
 * @param props - Properties defined in AppStartProps interface
 * @returns The app start component
 */
declare function AppStart(props: AppStartProps): JSX.Element;
export default AppStart;
//# sourceMappingURL=app-start.d.ts.map