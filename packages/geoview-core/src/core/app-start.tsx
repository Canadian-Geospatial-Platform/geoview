import type { ErrorInfo } from 'react';
import { StrictMode, Suspense, Component, useEffect, useMemo } from 'react';
import { I18nextProvider } from 'react-i18next';
import type { i18n } from 'i18next';

import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';

import { GlobalStyles, ScopedCssBaseline } from '@mui/material';
import { Shell } from '@/core/containers/shell';
import { getTheme } from '@/ui/style/theme';
import { logger } from '@/core/utils/logger';
import { useStoreAppDisplayThemeById } from '@/core/stores/states/app-state';
import type { TypeDisplayLanguage } from '@/api/types/map-schema-types';
import type { MapViewer } from '@/geo/map/map-viewer';
import { ControllerContext } from '@/core/controllers/base/controller-manager';
import { StoreContext } from '@/core/stores/store-context';

// GV Kept for the public API; internal code imports StoreContext from @/core/stores/store-context
export { StoreContext };

/** Defines the props for the AppStart component. */
interface AppStartProps {
  /** The map viewer instance to initialize. */
  mapViewer: MapViewer;
  /** The i18n language instance for internationalization. */
  i18nLang: i18n;
}

/**
 * A React error boundary component that catches JavaScript errors in its child tree,
 * logs them, and displays a localized fallback UI.
 */
class ErrorBoundary extends Component<{ children: JSX.Element; language: TypeDisplayLanguage }, { hasError: boolean }> {
  /**
   * Constructs an instance of ErrorBoundary.
   *
   * @param props - The children to render and the display language for fallback UI
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
        // Plain HTML + inline style (not Box/sx) intentionally: this fallback renders when ThemeProvider itself
        // may be gone (ErrorBoundary wraps ThemeProvider), so it must not depend on the theme context.
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
 * Initializes the app with maps from inline HTML configs and URL params.
 *
 * @param props - Properties defined in AppStartProps interface
 * @returns The app start component
 */
function AppStart(props: AppStartProps): JSX.Element {
  // Log
  logger.logTraceRender('components/app-start');

  const { mapViewer, i18nLang } = props;

  // GV get store values by id because context is not set.... it is the only atomic selector by id
  // once context is define, map id is available
  const theme = useStoreAppDisplayThemeById(mapViewer.mapId);

  /** Reuses this map's theme across renders, rebuilding only when the map ID or display theme changes. */
  const memoTheme = useMemo((): ReturnType<typeof getTheme> => {
    logger.logTraceUseMemo('AppStart memoTheme', mapViewer.mapId, theme);
    return getTheme(theme);
  }, [mapViewer.mapId, theme]);

  /**
   * Logs the mounting and unmounting of the AppStart component for debugging.
   */
  useEffect(() => {
    // Mounted - log initialization
    logger.logTraceUseEffect('AppStart useEffect', mapViewer.mapId);
    logger.logDebug('AppStart mounted, initializing mapViewer on mapId:', mapViewer.mapId);
    return () => {
      // Unmounted - log cleanup
      logger.logTraceUseEffectUnmount('AppStart useEffect', mapViewer.mapId);
      logger.logDebug('AppStart unmounted, cleaning up mapViewer on mapId:', mapViewer.mapId);
    };
  }, [mapViewer.mapId]);

  return (
    <ErrorBoundary language={(i18nLang.language as TypeDisplayLanguage) || 'en'}>
      <StyledEngineProvider injectFirst>
        <StoreContext.Provider value={mapViewer.mapId}>
          <ControllerContext.Provider value={mapViewer.controllers}>
            <ThemeProvider theme={memoTheme}>
              {/* Scope inherited scrollbar colours to this map without styling other viewers or the host page. */}
              <GlobalStyles
                styles={(currentTheme) => ({
                  [`#${CSS.escape(`${mapViewer.mapId}-shell`)}`]: {
                    scrollbarColor: `${currentTheme.palette.primary.main} ${
                      currentTheme.palette.surface?.low ?? currentTheme.palette.background.default
                    }`,
                  },
                })}
              />
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
          </ControllerContext.Provider>
        </StoreContext.Provider>
      </StyledEngineProvider>
    </ErrorBoundary>
  );
}

export default AppStart;
