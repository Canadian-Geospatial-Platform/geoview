import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Modal } from '@/ui/modal/modal';
import { Button } from '@/ui/button/button';

import { useUIController } from '@/core/controllers/use-controllers';
import { UseHtmlToReact } from '@/core/components/common/hooks/use-html-to-react';
import { getFocusTrapSxClasses } from './containers-style';
import type { SxStyles } from '@/ui/style/types';
import { ARROW_KEY_CODES } from '@/core/utils/constant';
import { doTimeout } from '@/core/utils/utilities';
import { DomHelper } from '@/core/utils/dom-helper';
import { logger } from '@/core/utils/logger';
import { useStoreUIActiveTrapGeoView } from '@/core/stores/states/ui-state';
import { useEventListener } from '@/core/components/common/hooks/use-event-listener';
import { useShellContainer } from './shell-container-context';

/** Interface for the focus trap properties. */
interface FocusTrapProps {
  /** The map identifier. */
  mapId: string;
  /** Registers the coordinated keyboard-navigation mode lifecycle with the viewer shell. */
  registerModeAction: (action: (active: boolean) => void) => () => void;
}

/** Delay in milliseconds before focusing an element after DOM updates. */
const FOCUS_DELAY = 0;

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
  const { mapId, registerModeAction } = props;

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const memoSxClasses = useMemo((): SxStyles => getFocusTrapSxClasses(theme), [theme]);

  // State
  const [open, setOpen] = useState<boolean>(false);
  const navigationLinkRef = useRef<TypeNavigationLink>('bottom');

  // Store
  // Tracks whether the user has entered keyboard navigation mode.
  const uiController = useUIController();
  const activeTrapGeoView = useStoreUIActiveTrapGeoView();

  // Get container and fullscreen state
  const shellContainer = useShellContainer();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  const gvRootElement = DomHelper.getGVRootElement(mapId);
  const mapTargetElement = DomHelper.getMapTargetElement(mapId);

  // ? useRef, if not mapTargetElement is undefined - happen because the value is used inside an event listener
  const mapElementRef = useRef(mapTargetElement);

  /**
   * Keeps the mapElementRef in sync with the store value.
   */
  useEffect(() => {
    logger.logTraceUseEffect('FOCUS-TRAP - mapElementRef', mapTargetElement);
    mapElementRef.current = mapTargetElement;
  }, [mapTargetElement]);

  // Use shellElementRef.current instead of querying DOM multiple times
  const shellElementRef = useRef<HTMLElement | null>(null);

  /** Cancels a pending focus request when a user moves focus elsewhere. */
  const focusJobRef = useRef<ReturnType<typeof doTimeout> | undefined>(undefined);

  /**
   * Caches the shell element reference to avoid repeated DOM queries.
   */
  useEffect(() => {
    logger.logTraceUseEffect('FOCUS-TRAP - shellElementRef');
    shellElementRef.current = shellContainer ?? null;
  }, [shellContainer]);

  /**
   * Tracks whether the entry dialog has opened or the user has explicitly selected a navigation mode.
   * Tab key presses are intercepted and redirected to skip links until this flag is set.
   */
  const hasBeenPromptedRef = useRef(false);

  /**
   * Intercepts Tab key presses until the entry dialog or an explicit mode selection handles onboarding.
   */
  useEffect(() => {
    logger.logTraceUseEffect('FOCUS-TRAP - Tab navigation guard');

    const handleTabNavigation = (evt: KeyboardEvent): void => {
      // Only intercept Tab key
      if (evt.key !== 'Tab' || activeTrapGeoView || hasBeenPromptedRef.current) {
        return;
      }

      const topLink = DomHelper.getWCAGTopLink(mapId);
      const bottomLink = DomHelper.getWCAGBottomLink(mapId);
      const currentFocus = DomHelper.getActiveElement();

      // Only intercept if focus is within geoview container
      if (!currentFocus || !gvRootElement.contains(currentFocus)) {
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
    gvRootElement.addEventListener('keydown', handleTabNavigation, { capture: true });

    return () => {
      gvRootElement.removeEventListener('keydown', handleTabNavigation, { capture: true });
    };
  }, [mapId, gvRootElement, activeTrapGeoView]);

  /**
   * Marks the user as having been prompted when the modal opens.
   */
  useEffect(() => {
    logger.logTraceUseEffect('FOCUS-TRAP - mark navigation prompt shown', open);
    if (open) {
      hasBeenPromptedRef.current = true;
    }
  }, [open]);

  /**
   * Disables scrolling on keydown space, so that screen doesn't scroll down
   * when focus is set to map and arrows and enter keys are used to navigate the map.
   */
  const handleScrolling = useCallback((evt: KeyboardEvent): void => {
    if (mapElementRef.current === DomHelper.getActiveElement()) {
      if (evt.code === 'Space') {
        evt.preventDefault();
      }
    }
  }, []);

  /**
   * Enables or disables the existing keyboard-navigation mode.
   *
   * @param active - Whether keyboard navigation is enabled
   */
  const setKeyboardNavigationMode = useCallback(
    (active: boolean): void => {
      hasBeenPromptedRef.current = true;
      focusJobRef.current?.cancel();
      uiController.setActiveTrapGeoView(active);
      if (!active) uiController.setCrosshairActive(false);
    },
    [uiController]
  );

  /**
   * After the keyboard-navigation entry dialog closes, focuses the requested target unless the user has moved focus elsewhere.
   *
   * @param getTarget - Resolves the map-scoped destination after rendering
   */
  const requestFocus = useCallback(
    (getTarget: () => HTMLElement | undefined): void => {
      focusJobRef.current?.cancel();
      focusJobRef.current = DomHelper.focusAfterEntryDialog(mapId, getTarget, FOCUS_DELAY);
    },
    [mapId]
  );

  /**
   * Exits keyboard navigation mode and restores the outer skip link.
   */
  const exitFocus = useCallback((): void => {
    setKeyboardNavigationMode(false);
    uiController.disableFocusTrap('no-focus');
    uiController.closeMapPopovers();
    DomHelper.getWCAGTopLink(mapId)?.focus({ focusVisible: true });
  }, [mapId, setKeyboardNavigationMode, uiController]);

  /**
   * Handles keyboard-navigation shortcuts and map focus styling.
   */
  const handleExit = useCallback(
    (evt: KeyboardEvent): void => {
      if (mapTargetElement && !ARROW_KEY_CODES.includes(evt.code)) mapTargetElement.style.border = 'unset';

      if (evt.code === 'KeyQ' && evt.ctrlKey) {
        evt.preventDefault();
        evt.stopPropagation();
        exitFocus();
      }
    },
    [exitFocus, mapTargetElement]
  );

  /**
   * Registers the shared mode action with the shell and installs mode-specific keyboard handlers.
   */
  useEffect(() => {
    logger.logTraceUseEffect('FOCUS-TRAP - mode lifecycle', activeTrapGeoView);

    const unregisterModeAction = registerModeAction(setKeyboardNavigationMode);
    const shellElement = shellElementRef.current;
    if (!shellElement) return unregisterModeAction;

    if (activeTrapGeoView) {
      gvRootElement.classList.add('map-focus-trap');
      shellElement.addEventListener('keydown', handleExit);
      shellElement.addEventListener('keydown', handleScrolling);
    } else {
      gvRootElement.classList.remove('map-focus-trap');
    }

    return (): void => {
      unregisterModeAction();
      shellElement.removeEventListener('keydown', handleExit);
      shellElement.removeEventListener('keydown', handleScrolling);
      gvRootElement.classList.remove('map-focus-trap');
    };
  }, [activeTrapGeoView, gvRootElement, handleExit, handleScrolling, registerModeAction, setKeyboardNavigationMode]);

  /**
   * Activates keyboard navigation and focuses the main-content link or viewer shell.
   */
  const handleEnable = useCallback((): void => {
    setOpen(false);
    setKeyboardNavigationMode(true);
    requestFocus(() => {
      const mapLink = DomHelper.getWCAGLinkToMap(mapId);
      if (mapLink) return mapLink;

      const shellElement = shellElementRef.current;
      if (!shellElement) logger.logError(`Keyboard-navigation shell was not found for map '${mapId}'`);
      return shellElement ?? undefined;
    });
  }, [mapId, requestFocus, setKeyboardNavigationMode]);

  /**
   * Closes the entry prompt and focuses the skip link selected by the user.
   */
  const handleSkip = useCallback((): void => {
    setOpen(false);
    const navigationLink = navigationLinkRef.current;
    requestFocus(() => {
      const targetLink = navigationLink === 'top' ? DomHelper.getWCAGTopLink(mapId) : DomHelper.getWCAGBottomLink(mapId);
      if (!targetLink) logger.logError(`WCAG ${navigationLink} skip link was not found for map '${mapId}'`);
      return targetLink;
    });
  }, [mapId, requestFocus]);

  /**
   * Manages skip top and bottom link navigation.
   */
  const manageLinks = useCallback((event: HTMLElementEventMap[keyof HTMLElementEventMap]): void => {
    // If not Tab, skip to the right link (handle the ref of the link)
    if (!(event instanceof KeyboardEvent) || event.key !== 'Tab') {
      return;
    }

    // If Tab from topLink or shift+Tab from bottomLink, focus the map element
    const targetId = (event.target as HTMLElement).id;
    let link: TypeNavigationLink | undefined;
    if (targetId.endsWith('-wcag-toplink')) link = 'top';
    else if (targetId.endsWith('-wcag-bottomlink')) link = 'bottom';
    if ((event.code === 'Tab' && !event.shiftKey && link === 'top') || (event.code === 'Tab' && event.shiftKey && link === 'bottom')) {
      // prevent the event to tab to inner map
      event.preventDefault();
      event.stopPropagation();
      navigationLinkRef.current = link === 'top' ? 'bottom' : 'top';

      setOpen(true);
      // Show the entry prompt at the viewer's keyboard-navigation boundary.
    }
  }, []);
  useEventListener<HTMLElement>('keydown', manageLinks, DomHelper.getWCAGBottomLink(mapId));
  useEventListener<HTMLElement>('keydown', manageLinks, DomHelper.getWCAGTopLink(mapId));

  /**
   * Dismisses the inactive entry prompt after real pointer movement outside the dialog.
   */
  useEffect(() => {
    logger.logTraceUseEffect('FOCUS-TRAP - dismiss entry prompt on pointer movement', open, activeTrapGeoView);
    if (!open || activeTrapGeoView) return undefined;

    const handleMouseMove = (event: MouseEvent): void => {
      if (event.movementX === 0 && event.movementY === 0) return;

      // Unlike the focus check, use only the visible dialog here so moving onto the backdrop dismisses it.
      const promptElement = DomHelper.getKeyboardNavigationDialogTitle(mapId)?.closest('.MuiDialog-paper');
      if (event.target instanceof Node && promptElement?.contains(event.target)) return;
      setOpen(false);
      focusJobRef.current?.cancel();
    };

    gvRootElement.addEventListener('mousemove', handleMouseMove);
    return (): void => gvRootElement.removeEventListener('mousemove', handleMouseMove);
  }, [activeTrapGeoView, gvRootElement, mapId, open]);

  /**
   * Focuses the enable button when the modal opens.
   */
  useEffect(() => {
    logger.logTraceUseEffect('FOCUS-TRAP - focus enable button', open, mapId);
    if (!open) return undefined;

    const delayJob = doTimeout(FOCUS_DELAY);
    const initialFocus = DomHelper.getActiveElement();
    delayJob.promise
      .then((result) => {
        const currentFocus = DomHelper.getActiveElement();
        if (
          result === 'timeout' &&
          (currentFocus === initialFocus || currentFocus?.tagName === 'BODY' || currentFocus?.id === `${mapId}-enable-focus`)
        ) {
          DomHelper.getGVElementById(mapId, 'enable-focus')?.focus();
        }
      })
      .catch((error) => {
        logger.logError('FocusTrapDialog enable-focus delay rejected unexpectedly:', error);
      });

    return () => {
      delayJob.cancel();
    };
  }, [open, mapId]);

  /**
   * Logs the currently active focused element for debugging.
   */
  function handleFocusIn(): void {
    const activeEl = DomHelper.getActiveElement();
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
      container={gvRootElement}
      modalId={mapId}
      open={open}
      aria-labelledby={`${mapId}-wcag-dialog-title`}
      aria-describedby={`${mapId}-wcag-dialog-description`}
      fullScreen={fullScreen}
      disableRestoreFocus
      sx={memoSxClasses.trap}
      titleId={`${mapId}-wcag-dialog-title`}
      title={t('keyboardnav.focusdialog.title')}
      contentTextId={`${mapId}-wcag-dialog-description`}
      contentModal={<UseHtmlToReact htmlContent={t('keyboardnav.focusdialog.main')} />}
      actions={
        <>
          <Button id={`${mapId}-enable-focus`} autoFocus onClick={handleEnable} type="text" sx={memoSxClasses.modalButton}>
            {t('keyboardnav.focusdialog.button.enable')}
          </Button>
          <Button id={`${mapId}-skip-focus`} onClick={handleSkip} type="text" sx={memoSxClasses.modalButton}>
            {t('keyboardnav.focusdialog.button.skip')}
          </Button>
        </>
      }
    />
  );
}

// #region TYPES AND INTERFACES

/** Identifies one of the map-scoped WCAG skip links. */
type TypeNavigationLink = 'top' | 'bottom';

// #endregion TYPES AND INTERFACES
