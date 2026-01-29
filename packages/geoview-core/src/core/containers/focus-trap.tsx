import { useEffect, useState, useRef, useMemo, useCallback } from 'react';

import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

import { Modal, Button } from '@/ui';
import { UseHtmlToReact } from '@/core/components/common/hooks/use-html-to-react';
import { getFocusTrapSxClasses } from './containers-style';
import { ARROW_KEY_CODES, TIMEOUT } from '@/core/utils/constant';
import { useAppGeoviewHTMLElement, useAppStoreActions } from '@/core/stores/store-interface-and-intial-values/app-state';
import { useUIActiveTrapGeoView, useUIStoreActions } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { logger } from '@/core/utils/logger';
import { useEventListener } from '@/core/components/common/hooks/use-event-listener';

/**
 * Interface for the focus trap properties
 */
interface FocusTrapProps {
  mapId: string;
  focusTrapId: string;
}

// Define constants and style outside component
const FOCUS_DELAY = 0;
const MODAL_BUTTON_STYLES = {
  width: 'initial',
  textTransform: 'none',
} as const;

/**
 * Create a dialog component to explain to keyboard user how to trigger and remove FocusTrap
 * @param {FocusTrapProps} props the focus trap dialog properties
 * @returns {JSX.Element} the focus trap dialog component
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
  const { setCrosshairActive } = useAppStoreActions();
  const { setActiveTrapGeoView } = useUIStoreActions();
  const activeTrapGeoView = useUIActiveTrapGeoView();

  // Get container and fullscreen state
  const geoviewElement = useAppGeoviewHTMLElement();
  const mapElementStore = geoviewElement.querySelector('[id^="mapTargetElement-"]') as HTMLElement;
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  // ? useRef, if not mapElementStore is undefined - happen because the value is used inside an event listener
  const mapElementRef = useRef(mapElementStore);
  useEffect(() => {
    logger.logTraceUseEffect('FOCUS-TRAP - mapElementRef', mapElementStore);
    mapElementRef.current = mapElementStore;
  }, [mapElementStore]);

  // Use shellElementRef.current instead of querying DOM multiple times
  const shellElementRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    logger.logTraceUseEffect('FOCUS-TRAP - shellElementRef');
    shellElementRef.current = geoviewElement.querySelector('.geoview-shell') as HTMLElement;
  }, [geoviewElement]);

  /**
   * Add effects to intercept first Tab key press and make sure focus goes to the top link
   * When the app loads and focus is inside the map container, keyboard users won't see the Keyboard navigation dialog
   * This sets focus to top link and ensures keyboard users will tab into the dialog
   */
  const hasBeenPromptedRef = useRef(false);

  // Set initial focus to toplink on mount
  useEffect(() => {
    logger.logTraceUseEffect('FOCUS-TRAP - initial focus setup');

    // Small delay to ensure DOM is ready and other components have initialized
    const focusTimeout = setTimeout(() => {
      const topLink = document.getElementById(`toplink-${focusTrapId}`);

      if (topLink && !activeTrapGeoView && !hasBeenPromptedRef.current) {
        const currentFocus = document.activeElement;

        // Only set focus if current focus is within the geoview container
        // This prevents stealing focus from elements outside the viewer
        if (geoviewElement.contains(currentFocus)) {
          topLink.focus();
          hasBeenPromptedRef.current = true;
        }
      }
    }, TIMEOUT.topLinkFocusDelay); // Delay to let panels initialize

    return () => clearTimeout(focusTimeout);
  }, [focusTrapId, activeTrapGeoView, geoviewElement]);

  // Intercept Tab navigation within geoview container to ensure toplink is visited
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

  // Reset prompt flag when modal is dismissed (user made a choice)
  useEffect(() => {
    if (open) {
      hasBeenPromptedRef.current = true;
    }
  }, [open]);

  /**
   * Disable scrolling on keydown space, so that screen doesnt scroll down.
   * when focus is set to map and arrows and enter keys are used to navigate the map
   *
   * @param {KeyboardEvent} evt the keyboard event to trap
   */
  const handleScrolling = useCallback((evt: KeyboardEvent): void => {
    if (mapElementRef.current === document.activeElement) {
      if (evt.code === 'Space') {
        logger.logTraceUseCallback('FOCUS-TRAP - handleScrolling', evt.code);
        evt.preventDefault();
      }
    }
  }, []);

  // Create an object to store shared functions (avoid circular dependencies)
  const handlers = useRef<{
    exit: () => void;
    handleKeyDown: (evt: KeyboardEvent) => void;
  }>();

  // Initialize the handlers object
  useEffect(() => {
    logger.logTraceUseEffect('FOCUS-TRAP - handlers', handlers.current);

    // The handlers.current ref pattern is being used to break circular dependencies.
    // The circular dependency occurs because:
    // - handleKeyDown needs to call exit
    // - exit needs to remove the handleKeyDown event listener
    // - If we used useCallback, each function would need to depend on the other
    handlers.current = {
      exit: () => {
        setActiveTrapGeoView(false);
        geoviewElement.classList.remove('map-focus-trap');

        if (handlers.current?.handleKeyDown && shellElementRef.current) {
          shellElementRef.current.removeEventListener('keydown', handlers.current.handleKeyDown);
        }
        document.removeEventListener('keydown', handleScrolling);

        // The setTimeout is used to ensure the DOM has been updated and the element is ready to receive focus
        setTimeout(() => document.getElementById(`toplink-${focusTrapId}`)?.focus(), FOCUS_DELAY);
        setCrosshairActive(false);
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
  }, [focusTrapId, geoviewElement, handleScrolling, mapElementStore, setActiveTrapGeoView, setCrosshairActive]);

  // Create memoized functions that use the handlers
  const exitFocus = useCallback(() => {
    logger.logTraceUseCallback('FOCUS-TRAP - exitFocus');
    handlers.current?.exit();
  }, []);

  const handleExit = useCallback((evt: KeyboardEvent) => {
    logger.logTraceUseCallback('FOCUS-TRAP - handleExit', evt.code);
    handlers.current?.handleKeyDown(evt);
  }, []);

  // Set focus trap function
  const setFocusTrap = useCallback(() => {
    if (shellElementRef.current) {
      logger.logTraceUseCallback('FOCUS TRAP - setFocusTrap');
      const mapHTMLElement = shellElementRef.current;

      setActiveTrapGeoView(true);
      mapHTMLElement.classList.add('map-focus-trap');
      mapHTMLElement.addEventListener('keydown', handleExit);

      // The setTimeout is used to ensure the DOM has been updated and the element is ready to receive focus
      // Focus on the skip to main content link to skip app bar
      setTimeout(() => document.getElementById(`main-map-${mapId}`)?.focus({ preventScroll: true }), FOCUS_DELAY);
    }
  }, [handleExit, mapId, setActiveTrapGeoView]);

  // Handle button clicks
  const handleEnable = useCallback((): void => {
    logger.logTraceUseCallback('FOCUS-TRAP - handleEnable');

    setOpen(false);
    setFocusTrap();
  }, [setFocusTrap]);

  const handleSkip = useCallback((): void => {
    setOpen(false);

    // The setTimeout is used to ensure the DOM has been updated and the element is ready to receive focus
    setTimeout(() => document.getElementById(navigationLinkRef.current)?.focus(), FOCUS_DELAY);
  }, []);

  /**
   * Manage skip top and bottom link. If user press enter it goes to top link and if he tries to focus the map, it goes to focus dialog
   * @param {KeyboardEvent} event the keyboard event
   */
  const manageLinks = useCallback(
    (event: HTMLElementEventMap[keyof HTMLElementEventMap]) => {
      // If not Tab, skip to the right link (handle the ref of the link)
      if (!(event instanceof KeyboardEvent) || event.key !== 'Tab') {
        return;
      }

      logger.logTraceUseCallback('FOCUS-TRAP - manageLinks', focusTrapId);

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

  // Ensure the enable button gets focus when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => document.getElementById('enable-focus')?.focus(), FOCUS_DELAY);
    }
  }, [open]);

  // Function to log the currently active/focused element
  function handleFocusIn(): void {
    const activeEl = document.activeElement;
    if (activeEl) {
      logger.logDebug('FOCUS-TRAP Focused element:', activeEl, 'id:', activeEl.id, 'class:', activeEl.className);
    }
  }

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
