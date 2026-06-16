import type { KeyboardEvent } from 'react';
import { useRef, useEffect, useMemo, useCallback } from 'react';

import { useTranslation } from 'react-i18next';

// TODO: reuse our own custom ui
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import { useTheme } from '@mui/material/styles';

import { Box } from '@/ui/layout';
import type { TypePanelProps } from '@/ui/panel/panel-types';
import type { SxStyles } from '@/ui/style/types';
import { CloseIcon } from '@/ui/icons';
import type { IconButtonPropsExtend } from '@/ui/icon-button/icon-button';
import { IconButton } from '@/ui/icon-button/icon-button';
import { getSxClasses } from '@/ui/panel/panel-style';
import { UseHtmlToReact } from '@/core/components/common/hooks/use-html-to-react';
import { useStoreUIActiveTrapGeoView } from '@/core/stores/states/ui-state';
import { FocusTrapContainer } from '@/core/components/common';
import { doTimeout } from '@/core/utils/utilities';
import { logger } from '@/core/utils/logger';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import { CONTAINER_TYPE } from '@/core/utils/constant';

/** Extra milliseconds added to transition duration to ensure CSS transitions fully complete before callbacks fire. */
const TRANSITION_BUFFER_MS = 50;

/** Interface for panel properties. */
export type TypePanelAppProps = {
  panel: TypePanelProps;
  button: IconButtonPropsExtend;

  // Callback when the user clicked the general close button
  onGeneralClose?: () => void;
  // Callback when the panel has completed opened (and transitioned in)
  onOpen?: () => void;
  // Callback when the panel has been closed
  onClose?: () => void;
  // Callback when the panel has been closed by escape key
  onKeyDown?: (event: KeyboardEvent) => void;
};

/**
 * Creates the Material-UI Panel component for displaying collapsible content with header and close button.
 *
 * Wraps card components with title, close button, and animated slide-in transitions.
 * Manages focus trapping and accessibility attributes for modal-like behavior when needed.
 * Content can be HTML strings or React elements.
 *
 * @param props - Properties defined in TypePanelAppProps interface
 * @returns Panel component with slide animation and focus management
 *
 * @example
 * ```tsx
 * <Panel
 *   panel={{ title: 'settings.title', content: 'Panel content' }}
 *   button={{ id: 'panel-btn' }}
 *   onOpen={() => console.log('opened')}
 * />
 * ```
 *
 * @see {@link https://mui.com/material-ui/react-card/}
 */
function PanelUI(props: TypePanelAppProps): JSX.Element {
  logger.logTraceRenderDetailed('ui/panel/panel');

  // Get constant from props
  const { panel, button, onOpen, onClose, onGeneralClose, onKeyDown, ...rest } = props;
  const { status: open = false, isFocusTrapped = false, panelStyles, panelId } = panel;

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const panelContainerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelHeader = useRef<HTMLButtonElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  /** Persists the panel's open state across renders to distinguish user-triggered opens from panels configured to start open by default. */
  const prevOpenRef = useRef(open);
  const panelWidth = panel?.width ?? 100; //percentage
  const memoSxClasses = useMemo((): SxStyles => {
    return getSxClasses(theme, open, panelWidth);
  }, [theme, open, panelWidth]);

  // Store
  const mapId = useStoreGeoViewMapId();
  const activeTrapGeoView = useStoreUIActiveTrapGeoView();

  /**
   * Creates a cancellable delay for panel transitions.
   *
   * @param callback - Function to execute after the transition delay (can be sync or async)
   * @param context - Context string for error logging ('open' or 'close')
   * @returns The delay job that can be cancelled
   */
  const createTransitionDelay = useCallback(
    (callback: () => void | Promise<void>, context: 'open' | 'close'): ReturnType<typeof doTimeout> => {
      const delay = doTimeout(theme.transitions.duration.standard + TRANSITION_BUFFER_MS);

      delay.promise
        .then((result) => {
          if (result === 'timeout') {
            // Defer callback execution to microtask to catch both sync throws and async rejections
            Promise.resolve()
              .then(() => callback())
              .catch((error) => {
                logger.logError(`Panel ${context} callback threw an error:`, error);
              });
          }
        })
        .catch((error) => {
          // This catches promise rejections only (not callback exceptions)
          logger.logError(`Panel ${context} transition delay rejected unexpectedly:`, error);
        });

      return delay;
    },
    [theme.transitions.duration.standard]
  );

  /**
   * Manages panel open/close transitions and focus behavior after CSS transitions complete.
   */

  useEffect(() => {
    logger.logTraceUseEffect('UI.PANEL - open');

    const prevOpen = prevOpenRef.current;
    prevOpenRef.current = open;

    // Create cancellable delay job
    let delayJob: ReturnType<typeof doTimeout> | undefined = undefined;

    if (open) {
      delayJob = createTransitionDelay(() => {
        // Focus close button only on user-triggered open (!prevOpen), not initial render.
        // This prevents focus hijacking with configurations that have an appBar panel open by default,
        // preserving the host page's natural tab order until GeoView is interacted with.
        // Focus happens after transition to ensure the button ref is set.
        if (!prevOpen && closeBtnRef?.current) {
          closeBtnRef.current.focus();
        }
        onOpen?.();
      }, 'open');
    } else {
      delayJob = createTransitionDelay(() => {
        onClose?.();
      }, 'close');
    }

    // Cleanup: cancel pending delay when effect re-runs or component unmounts
    return () => {
      if (delayJob) {
        delayJob.cancel();
      }
    };
  }, [open, createTransitionDelay, onOpen, onClose]);

  return (
    <Box
      component="section"
      role={open && activeTrapGeoView ? 'dialog' : undefined}
      aria-label={t('general.panelLabel', { title: t(panel.title) })}
      aria-hidden={!open}
      aria-modal={open && activeTrapGeoView ? true : undefined}
      sx={{
        ...memoSxClasses.panelContainer,
        ...(panelStyles?.panelContainer && { ...panelStyles.panelContainer }),
      }}
      ref={panelContainerRef}
      id={`${mapId}-${CONTAINER_TYPE.APP_BAR}${panelId ? `-${panelId}` : ''}-panel`}
      className={`appbar-panel${panelId ? ` appbar-panel-${panelId}` : ''}`}
    >
      <FocusTrapContainer open={isFocusTrapped} id="app-bar-focus-trap" containerType={CONTAINER_TYPE.APP_BAR}>
        <Card
          sx={{
            ...memoSxClasses.panelCard,
            display: open ? 'block' : 'none',
            ...(panelStyles?.panelCard && { ...panelStyles.panelCard }),
          }}
          ref={panelRef}
          onKeyDown={(event: KeyboardEvent) => onKeyDown?.(event)}
          {...{ 'data-id': button.id }}
          className="panel-card"
          {...rest}
        >
          <CardHeader
            component="header"
            sx={panelStyles?.panelCardHeader ? { ...panelStyles.panelCardHeader } : {}}
            ref={panelHeader}
            title={t(panel.title)}
            slotProps={{
              title: {
                component: 'h2',
              },
            }}
            action={
              open ? (
                <IconButton
                  id={`${mapId}-${CONTAINER_TYPE.APP_BAR}${panelId ? `-${panelId}` : ''}-panel-close-btn`}
                  aria-label={t('general.close')}
                  tooltipPlacement="right"
                  size="small"
                  onClick={() => onGeneralClose?.()}
                  iconRef={closeBtnRef}
                  className="cgpv-panel-close"
                >
                  <CloseIcon />
                </IconButton>
              ) : (
                ''
              )
            }
          />

          <CardContent sx={{ ...memoSxClasses.panelCardContent, ...(panelStyles ? panelStyles.panelCardContent : {}) }}>
            {typeof panel.content === 'string' ? <UseHtmlToReact htmlContent={panel.content} /> : panel.content}
          </CardContent>
        </Card>
      </FocusTrapContainer>
    </Box>
  );
}

export const Panel = PanelUI;
