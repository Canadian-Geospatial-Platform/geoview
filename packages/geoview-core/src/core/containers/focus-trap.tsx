import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Modal, Button } from '@/ui';

import { useUIController } from '@/core/controllers/ui-controller';
import { UseHtmlToReact } from '@/core/components/common/hooks/use-html-to-react';
import { getFocusTrapSxClasses } from './containers-style';
import { ARROW_KEY_CODES } from '@/core/utils/constant';
import { logger } from '@/core/utils/logger';
import { useStoreAppGeoviewHTMLElement } from '@/core/stores/store-interface-and-intial-values/app-state';
import { useStoreUIActiveTrapGeoView } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { useEventListener } from '@/core/components/common/hooks/use-event-listener';

/** Interface for the focus trap properties. */
interface FocusTrapProps {
  /** The map identifier. */
  mapId: string;
  /** The focus trap element identifier. */
  focusTrapId: string;
}

/** Delay in milliseconds before focusing an element after DOM updates. */
const FOCUS_DELAY = 0;
/** Default styles for modal action buttons. */
const MODAL_BUTTON_STYLES = {
  width: 'initial',
  textTransform: 'none',
} as const;

/**
 * Creates a dialog component to explain to keyboard user how to trigger and remove FocusTrap.
 *
 * @param props - The focus trap dialog properties
 * @returns The focus trap dialog component
 */
export function FocusTrapDialog(props: FocusTrapProps): JSX.Element {
  // Log
  logger.logTraceRender('containers/focus-trap/focus-trap');

  // Read from props
  const { mapId, focusTrapId } = props;

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = useMemo(() => getFocusTrapSxClasses(theme), [theme]);

  // State
  const [open, setOpen] = useState(false);
  const navigationLinkRef = useRef('');

  // Store
  // tracks if the last action was done through a keyboard (map navigation) or mouse (mouse movement)
  const uiController = useUIController();
  const activeTrapGeoView = useStoreUIActiveTrapGeoView();

  // Get container and fullscreen state
  const geoviewElement = useStoreAppGeoviewHTMLElement();
  const mapElementStore = geoviewElement.querySelector('[id^="mapTargetElement-"]') as HTMLElement;
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  // ? useRef, if not mapElementStore is undefined - happen because the value is used inside an event listener
  const mapElementRef = useRef(mapElementStore);

  /**
   * Keeps the mapElementRef in sync with the store value.
   */
  useEffect(() => {
    logger.logTraceUseEffect('FOCUS-TRAP - mapElementRef', mapElementStore);
    mapElementRef.current = mapElementStore;
  }, [mapElementStore]);

  // Use shellElementRef.current instead of querying DOM multiple times
  const shellElementRef = useRef<HTMLElement | null>(null);

  /**
   * Caches the shell element reference to avoid repeated DOM queries.
   */
  useEffect(() => {
    logger.logTraceUseEffect('FOCUS-TRAP - shellElementRef');
    shellElementRef.current = geoviewElement.querySelector('.geoview-shell') as HTMLElement;
  }, [geoviewElement]);

  /**
   * Tracks whether the keyboard navigation dialog has been shown to the user.
   * Tab key presses are intercepted and redirected to skip links until this flag is set.
   */
  const hasBeenPromptedRef = useRef(false);

  /**
   * Intercepts Tab key presses to redirect focus to skip links until the user has been prompted.
   */
  useEffect(() => {
    logger.logTraceUseEffect('FOCUS-TRAP - Tab navigation guard');

    const handleTabNavigation = (evt: KeyboardEvent): void => {
      // Only intercept Tab key
      if (evt.key !== 'Tab' || activeTrapGeoView || hasBeenPromptedRef.current) {
        return;
      }

      const topLink = document.getElementById(`toplink-${focusTrapId}`);
      const bottomLink = document.getElementById(`bottomlink-${focusTrapId}`);
      const currentFocus = document.activeElement;

      // Only intercept if focus is within geoview container
      if (!currentFocus || !geoviewElement.contains(currentFocus)) {
        return;
      }

      // Always redirect to toplink when NOT on toplink or bottomlink
      // This ensures keyboard users encounter the navigation dialog
      if (currentFocus !== topLink && currentFocus !== bottomLink) {
        evt.preventDefault();
        topLink?.focus();
      }
    };

    // Use capture phase to intercept before other handlers
    // Scope to geoviewElement to avoid conflicts with other maps
    geoviewElement.addEventListener('keydown', handleTabNavigation, { capture: true });

    return () => {
      geoviewElement.removeEventListener('keydown', handleTabNavigation, { capture: true });
    };
  }, [focusTrapId, geoviewElement, activeTrapGeoView]);

  /**
   * Marks the user as having been prompted when the modal opens.
   * Reset prompt flag when modal is dismissed.
   */
  useEffect(() => {
    if (open) {
      hasBeenPromptedRef.current = true;
    }
  }, [open]);

  /**
   * Disables scrolling on keydown space, so that screen doesn't scroll down
   * when focus is set to map and arrows and enter keys are used to navigate the map.
   *
   * @param evt - The keyboard event to intercept
   */
  const handleScrolling = useCallback((evt: KeyboardEvent): void => {
    if (mapElementRef.current === document.activeElement) {
      if (evt.code === 'Space') {
        evt.preventDefault();
      }
    }
  }, []);

  // Create an object to store shared functions (avoid circular dependencies)
  const handlers = useRef<{
    exit: () => void;
    handleKeyDown: (evt: KeyboardEvent) => void;
  }>();

  /**
   * Initializes the handlers ref with exit and keydown functions to avoid circular dependencies.
   */
  useEffect(() => {
    logger.logTraceUseEffect('FOCUS-TRAP - handlers', handlers.current);

    // The handlers.current ref pattern is being used to break circular dependencies.
    // The circular dependency occurs because:
    // - handleKeyDown needs to call exit
    // - exit needs to remove the handleKeyDown event listener
    // - If we used useCallback, each function would need to depend on the other
    handlers.current = {
      exit: () => {
        uiController.setActiveTrapGeoView(false);
        geoviewElement.classList.remove('map-focus-trap');

        if (handlers.current?.handleKeyDown && shellElementRef.current) {
          shellElementRef.current.removeEventListener('keydown', handlers.current.handleKeyDown);
        }
        document.removeEventListener('keydown', handleScrolling);

        // The setTimeout is used to ensure the DOM has been updated and the element is ready to receive focus
        setTimeout(() => document.getElementById(`toplink-${focusTrapId}`)?.focus(), FOCUS_DELAY);
        uiController.setCrosshairActive(false);
      },
      handleKeyDown: (evt: KeyboardEvent) => {
        if (!ARROW_KEY_CODES.includes(evt.code)) {
          mapElementStore.style.border = 'unset';
        }

        if (evt.code === 'KeyQ' && evt.ctrlKey) {
          handlers.current?.exit();
        }
      },
    };
  }, [focusTrapId, geoviewElement, handleScrolling, mapElementStore, uiController]);

  /**
   * Exits the focus trap by delegating to the handlers ref.
   */
  const exitFocus = useCallback((): void => {
    handlers.current?.exit();
  }, []);

  /**
   * Handles keydown events by delegating to the handlers ref.
   */
  const handleExit = useCallback((evt: KeyboardEvent): void => {
    handlers.current?.handleKeyDown(evt);
  }, []);

  /**
   * Activates the focus trap on the shell element.
   */
  const setFocusTrap = useCallback((): void => {
    if (shellElementRef.current) {
      const mapHTMLElement = shellElementRef.current;

      uiController.setActiveTrapGeoView(true);
      mapHTMLElement.classList.add('map-focus-trap');
      mapHTMLElement.addEventListener('keydown', handleExit);

      // The setTimeout is used to ensure the DOM has been updated and the element is ready to receive focus
      // Focus on the skip to main content link to skip app bar
      setTimeout(() => document.getElementById(`main-map-${mapId}`)?.focus({ preventScroll: true }), FOCUS_DELAY);
    }
  }, [handleExit, mapId, uiController]);

  /**
   * Handles when the user clicks the enable focus trap button.
   */
  const handleEnable = useCallback((): void => {
    setOpen(false);
    setFocusTrap();
  }, [setFocusTrap]);

  /**
   * Handles when the user clicks the skip button.
   */
  const handleSkip = useCallback((): void => {
    setOpen(false);

    // The setTimeout is used to ensure the DOM has been updated and the element is ready to receive focus
    setTimeout(() => document.getElementById(navigationLinkRef.current)?.focus(), FOCUS_DELAY);
  }, []);

  /**
   * Manages skip top and bottom link navigation.
   *
   * @param event - The DOM event triggered on the skip link element
   */
  const manageLinks = useCallback(
    (event: HTMLElementEventMap[keyof HTMLElementEventMap]): void => {
      // If not Tab, skip to the right link (handle the ref of the link)
      if (!(event instanceof KeyboardEvent) || event.key !== 'Tab') {
        return;
      }

      // If Tab from topLink or shift+Tab from bottomLink, focus the map element
      const linkId = (event.target as HTMLElement).id.split('-')[0];
      if (
        (event.code === 'Tab' && !event.shiftKey && linkId === 'toplink') ||
        (event.code === 'Tab' && event.shiftKey && linkId === 'bottomlink')
      ) {
        // prevent the event to tab to inner map
        event.preventDefault();
        event.stopPropagation();
        navigationLinkRef.current = linkId === 'toplink' ? `bottomlink-${focusTrapId}` : `toplink-${focusTrapId}`;

        setOpen(true);
        // when map element get focus and focus is not trap, show dialog window
        // if user move the mouse over the map, cancel the dialog
        // remove the top and bottom link from focus cycle and start the FocusTrap
        document.addEventListener('keydown', handleScrolling);
        if (shellElementRef.current) {
          shellElementRef.current.addEventListener(
            'mousemove',
            () => {
              setOpen(false);
              exitFocus();
            },
            { once: true }
          );
        }
      }
    },
    [exitFocus, focusTrapId, handleScrolling]
  );
  useEventListener<HTMLElement>('keydown', manageLinks, document.getElementById(`bottomlink-${focusTrapId}`));
  useEventListener<HTMLElement>('keydown', manageLinks, document.getElementById(`toplink-${focusTrapId}`));

  /**
   * Focuses the enable button when the modal opens.
   */
  useEffect(() => {
    if (open) {
      setTimeout(() => document.getElementById('enable-focus')?.focus(), FOCUS_DELAY);
    }
  }, [open]);

  /**
   * Logs the currently active focused element for debugging.
   */
  function handleFocusIn(): void {
    const activeEl = document.activeElement;
    if (activeEl) {
      logger.logDebug('FOCUS-TRAP Focused element:', activeEl, 'id:', activeEl.id, 'class:', activeEl.className);
    }
  }

  /**
   * Registers or removes the focusin debug listener based on the active trap state.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('FOCUS-TRAP - handleFocusIn', activeTrapGeoView);

    if (activeTrapGeoView) document.addEventListener('focusin', handleFocusIn);
    else document.removeEventListener('focusin', handleFocusIn);

    return () => document.removeEventListener('focusin', handleFocusIn);
  }, [activeTrapGeoView]);

  return (
    <Modal
      container={document.getElementById(focusTrapId)!}
      modalId={focusTrapId}
      open={open}
      aria-labelledby={t('keyboardnav.focusdialog.title')!}
      aria-describedby={t('keyboardnav.focusdialog.title')!}
      fullScreen={fullScreen}
      sx={sxClasses.trap}
      titleId="wcag-dialog-title"
      title={t('keyboardnav.focusdialog.title')}
      contentTextId="wcag-dialog-description"
      contentModal={<UseHtmlToReact htmlContent={t('keyboardnav.focusdialog.main')} />}
      actions={
        <>
          <Button id="enable-focus" autoFocus onClick={handleEnable} type="text" sx={MODAL_BUTTON_STYLES}>
            {t('keyboardnav.focusdialog.button.enable')}
          </Button>
          <Button
            id="skip-focus"
            onClick={handleSkip}
            type="text"
            sx={{
              width: 'initial',
              textTransform: 'none',
            }}
          >
            {t('keyboardnav.focusdialog.button.skip')}
          </Button>
        </>
      }
    />
  );
}
