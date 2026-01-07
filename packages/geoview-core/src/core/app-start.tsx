import type { ErrorInfo } from 'react';
import { createContext, StrictMode, Suspense, useMemo, Component } from 'react';
import { I18nextProvider } from 'react-i18next';
import type { i18n } from 'i18next';

import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';

import { ScopedCssBaseline } from '@mui/material';
import { Shell } from '@/core/containers/shell';
import { getTheme } from '@/ui/style/theme';
import { logger } from '@/core/utils/logger';
import { useAppDisplayThemeById } from '@/core/stores/store-interface-and-intial-values/app-state';
import type { TypeDisplayLanguage } from '@/api/types/map-schema-types';
import type { MapViewer } from '@/geo/map/map-viewer';

// create a state that will hold map config information
// TODO: use store, only keep map id on context for store manager to gather right store on hooks
export const MapContext = createContext<TypeMapContext>({
  mapId: '',
});

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
 * A React error boundary component that catches JavaScript errors anywhere in its child component tree,
 * logs those errors, and displays a fallback UI. It also attempts to automatically recover from errors
 * with up to 3 retries using exponential backoff, and provides a manual retry button for user intervention.
 *
 * @remarks
 * - Uses `componentDidCatch` to log errors and update state.
 * - Schedules automatic retries with exponential backoff (up to 10 seconds max delay).
 * - Displays error details and retry attempt count in the fallback UI.
 * - Clears any pending retry timeouts on unmount.
 *
 * @props
 * @param children - The React child nodes to render within the error boundary.
 * @param language - The language code for internationalization.
 *
 * @state
 * @property hasError - Indicates if an error has been caught.
 * @property errorInfo - The component stack trace or error details.
 * @property retryCount - The number of retry attempts made.
 */
class ErrorBoundary extends Component<{ children: JSX.Element; language: TypeDisplayLanguage }, { hasError: boolean }> {
  /**
   * Constructor
   * @param {{ children: JSX.Element; language: TypeDisplayLanguage }} props - The props
   */
  constructor(props: { children: JSX.Element; language: TypeDisplayLanguage }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    // Keep the retry count from previous state
    return { hasError: true };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log both the error and component stack
    logger.logError('React error caught:', error);
    logger.logError('Component stack:', errorInfo.componentStack);
  }

  override render(): JSX.Element {
    const { hasError } = this.state;
    const { children, language } = this.props;

    if (hasError) {
      return (
        <div style={{ padding: '10px', border: '1px solid red' }}>
          <p>
            {language === 'fr'
              ? "Une erreur est survenue dans l'application. Veuillez rafraîchir votre page/onglet pour tenter de résoudre le problème."
              : 'An error occurred in the application. Please refresh your tab/page browser to try to fix the issue.'}
          </p>
        </div>
      );
    }

    // Return the single child directly
    return children;
  }
}

/**
 * Initialize the app with maps from inline html configs, url params
 */
function AppStart(props: AppStartProps): JSX.Element {
  // Log
  logger.logTraceRender('components/app-start');

  const { mapViewer, i18nLang } = props;

  const mapContextValue = useMemo(() => {
    // Log
    logger.logTraceUseMemo('APP-START - mapContextValue', mapViewer.mapId);

    return { mapId: mapViewer.mapId };
  }, [mapViewer.mapId]);

  // GV get store values by id because context is not set.... it is the only atomic selector by id
  // once context is define, map id is available
  const theme = useAppDisplayThemeById(mapViewer.mapId);

  return (
    <ErrorBoundary language={(i18nLang.language as TypeDisplayLanguage) || 'en'}>
      <StyledEngineProvider injectFirst>
        <MapContext.Provider value={mapContextValue}>
          <ThemeProvider theme={getTheme(theme)}>
            <ScopedCssBaseline>
              <Suspense fallback="">
                <I18nextProvider i18n={i18nLang}>
                  <StrictMode>
                    <Shell mapViewer={mapViewer} />
                  </StrictMode>
                </I18nextProvider>
              </Suspense>
            </ScopedCssBaseline>
          </ThemeProvider>
        </MapContext.Provider>
      </StyledEngineProvider>
    </ErrorBoundary>
  );
}

export default AppStart;
