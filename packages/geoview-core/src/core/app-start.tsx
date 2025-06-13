import { createContext, StrictMode, Suspense, useMemo, useState, useCallback, useEffect, Component, ReactNode, ErrorInfo } from 'react';
import { I18nextProvider } from 'react-i18next';
import { i18n } from 'i18next';

import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';

import { ScopedCssBaseline } from '@mui/material';
import { Shell } from '@/core/containers/shell';
import { getTheme } from '@/ui/style/theme';
import { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { logger } from '@/core/utils/logger';
import { useAppDisplayThemeById } from '@/core/stores/store-interface-and-intial-values/app-state';
import { api } from '@/app';
import { TypeDisplayLanguage } from '@/api/config/types/map-schema-types';

// Extend the Window interface to include forceMapRerender
declare global {
  interface Window {
    forceMapRerender?: { [mapId: string]: () => void };
  }
}

// TODO: CLEAN - Remove these temporary logs
logger.logInfo('CREATING CONTEXT');

// create a state that will hold map config information
// TODO: use store, only keep map id on context for store manager to gather right store on hooks
export const MapContext = createContext<TypeMapContext>({
  mapId: '',
  mapFeaturesConfig: undefined,
});

// TODO: CLEAN - Remove these temporary logs
logger.logInfo('CONTEXT CREATED');

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
  i18nLang: i18n;
}

const AUTO_RETRY_ERRORS = process.env.NODE_ENV === 'development' || false;

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
class ErrorBoundary extends Component<{ children: ReactNode; language: TypeDisplayLanguage }, { hasError: boolean; retryCount: number }> {
  #retryTimeoutId: number | null = null;

  constructor(props: { children: ReactNode; language: TypeDisplayLanguage }) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(): { hasError: boolean; retryCount: number } {
    // Keep the retry count from previous state
    return { hasError: true, retryCount: 0 };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log both the error and component stack
    logger.logError('React error caught:', error);
    logger.logError('Component stack:', errorInfo.componentStack);

    this.setState((prevState) => ({
      retryCount: prevState.retryCount + 1,
    }));

    // Only auto-retry in debug mode
    const { retryCount } = this.state;
    if (AUTO_RETRY_ERRORS && retryCount < 3) {
      this.scheduleRetry();
    }
  }

  override componentWillUnmount(): void {
    // Clear any pending retry timeout
    if (this.#retryTimeoutId !== null) {
      window.clearTimeout(this.#retryTimeoutId);
    }
  }

  scheduleRetry = (): void => {
    // Clear any existing timeout
    if (this.#retryTimeoutId !== null) {
      window.clearTimeout(this.#retryTimeoutId);
    }

    // Schedule a retry with exponential backoff
    const { retryCount } = this.state;
    const delay = Math.min(1000 * 2 ** retryCount, 10000);
    this.#retryTimeoutId = window.setTimeout(() => {
      logger.logInfo(`Attempting to recover from error (attempt ${retryCount})...`);
      this.setState({ hasError: false });
    }, delay);
  };

  override render(): ReactNode {
    const { hasError, retryCount } = this.state;
    const { children, language } = this.props;

    if (hasError) {
      return (
        <div style={{ padding: '10px', border: '1px solid red' }}>
          {AUTO_RETRY_ERRORS ? (
            <p>
              {language === 'fr'
                ? `Tentative de récupération automatique... (Essai ${retryCount}/3)`
                : `Automatically retrying... (Attempt ${retryCount}/3)`}
            </p>
          ) : (
            <p>
              {language === 'fr'
                ? "Une erreur est survenue dans l'application. Veuillez rafraîchir votre page/onglet pour résoudre le problème."
                : 'An error occurred in the application. Please refresh your tab/page browser to fix the issue.'}
            </p>
          )}
        </div>
      );
    }

    return children;
  }
}

/**
 * Initialize the app with maps from inline html configs, url params
 */
function AppStart(props: AppStartProps): JSX.Element {
  // Log
  logger.logTraceRender('components/app-start');

  const { mapFeaturesConfig, i18nLang } = props;
  const { mapId, displayLanguage } = mapFeaturesConfig;

  const mapContextValue = useMemo(() => {
    // Log
    logger.logTraceUseMemo('APP-START - mapContextValue', mapId);

    return { mapId };
  }, [mapId]);

  // GV get store values by id because context is not set.... it is the only atomic selector by id
  // once context is define, map id is available
  const theme = useAppDisplayThemeById(mapId);

  // Add state for re-rendering
  const [renderKey, setRenderKey] = useState(0);

  // Function to force re-render
  const forceRerender = useCallback(() => {
    setRenderKey((prev) => prev + 1);
  }, []);

  // Expose the re-render function to window for debugging
  useEffect(() => {
    if (window && mapId) {
      window.forceMapRerender = window.forceMapRerender || {};
      window.forceMapRerender[mapId] = forceRerender;
    }
    return () => {
      if (window && window.forceMapRerender && mapId) {
        delete window.forceMapRerender[mapId];
      }
    };
  }, [mapId, forceRerender]);

  return (
    <ErrorBoundary language={displayLanguage || 'en'}>
      <StyledEngineProvider injectFirst>
        <MapContext.Provider value={mapContextValue}>
          <ThemeProvider theme={getTheme(theme)}>
            <ScopedCssBaseline>
              <Suspense fallback="">
                <I18nextProvider i18n={i18nLang}>
                  <StrictMode>
                    <Shell key={renderKey} mapViewer={api.getMapViewer(mapId)} />
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
