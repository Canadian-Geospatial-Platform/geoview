import { useEffect, useState, useRef, MutableRefObject } from 'react';

import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

import { useStore } from 'zustand';
import { getGeoViewStore } from '@/core/stores/stores-managers';

import { Modal, Button } from '@/ui';
import { HtmlToReact } from './html-to-react';
import { getFocusTrapSxClasses } from './containers-style';
import { disableScrolling } from '@/app';

/**
 * Interface for the focus trap properties
 */
interface FocusTrapProps {
  mapId: string;
  focusTrapId: string;
  callback: (dialogTrap: boolean) => void;
}

/**
 * Create a dialog component to explain to keyboard user how to trigger and remove FocusTrap
 * @param {FocusTrapProps} props the focus trap dialog properties
 * @returns {JSX.Element} the focus trap dialog component
 */
export function FocusTrapDialog(props: FocusTrapProps): JSX.Element {
  const { mapId, focusTrapId, callback } = props;

  const { t } = useTranslation<string>();

  const theme = useTheme();
  const sxClasses = getFocusTrapSxClasses(theme);

  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  // internal component state
  const [open, setOpen] = useState(false);
  const navigationLinkRef = useRef() as MutableRefObject<string | undefined>;

  // get store values
  // tracks if the last action was done through a keyboard (map navigation) or mouse (mouse movement)
  const store = getGeoViewStore(mapId);
  const mapElementStore = useStore(store, (state) => state.mapState.mapElement);

  // ? useRef, if not mapElementStore is undefined - may be because this component is created before the mapElement
  // TODO: Find what is going on with mapElement for focus-trap and crosshair
  const mapElementRef = useRef(mapElementStore);
  mapElementRef.current = mapElementStore;

  // ? use reference HTML element to disable scrolling
  const mapHTMLElementRef = useRef<HTMLElement>();
  if (mapElementRef.current !== undefined) mapHTMLElementRef.current = mapElementRef.current.getTargetElement();

  /**
   * Disable scrolling on space keydown when focus-trap
   *
   * @param {KeyboardEvent} evt the keyboard event to trap
   */
  function handleScrolling(evt: KeyboardEvent): void {
    disableScrolling(evt, mapHTMLElementRef);
  }

  /**
   * Exit the focus trap
   */
  function exitFocus(): void {
    const mapHTMLElement = mapHTMLElementRef.current!.parentElement as HTMLElement;

    // the user escape the trap, remove it, put back skip link in focus cycle and zoom to top link
    callback(false);
    mapHTMLElement.classList.remove('map-focus-trap');
    // mapHTMLElement.removeEventListener('keydown',handleExit); //! can't remove because of eslint @typescript-eslint/no-use-before-define
    document.removeEventListener('keydown', handleScrolling);

    // update store and focus to top link
    setTimeout(() => document.getElementById(`toplink-${focusTrapId}`)?.focus(), 0);
    getGeoViewStore(mapId).setState({ isCrosshairsActive: false });
  }

  // handle FocusTrap states (Exit)
  const handleExit = (evt: KeyboardEvent) => {
    if (evt.code === 'KeyQ' && evt.ctrlKey) exitFocus();
  };

  /**
   * Set the focus trap
   */
  function setFocusTrap(): void {
    const mapHTMLElement = mapHTMLElementRef.current!.parentElement as HTMLElement;

    // add a class to specify the viewer is in focus trap mode
    callback(true);
    mapHTMLElement.classList.add('map-focus-trap');
    mapHTMLElement.addEventListener('keydown', handleExit);

    // update the store and focus to map
    setTimeout(() => document.getElementById(`map-${mapId}`)?.focus(), 0);
    store.setState({ isCrosshairsActive: true });
  }

  // handle FocusTrap states (Enable, Skip)
  const handleEnable = () => {
    setOpen(false);
    setFocusTrap();
  };

  const handleSkip = () => {
    // because the process is about to focus the map, apply a timeout before shifting focus on bottom or top link
    setOpen(false);
    setTimeout(() => document.getElementById(navigationLinkRef.current!)?.focus(), 0);
  };

  /**
   * Manage skip top and bottom link. If user press enter it goes to top link and if he tries to focus the map, it goes to focus dialog
   * @param {KeyboardEvent} evt the keyboard event
   */
  function manageLinks(evt: KeyboardEvent): void {
    // if Enter, skip to the right link (handle the ref of the link)
    // if Tab from topLink or shift+Tab from bottomLink, focus the map element
    const linkId = (evt.target as HTMLElement).id.split('-')[0];
    if ((evt.code === 'Tab' && !evt.shiftKey && linkId === 'toplink') || (evt.code === 'Tab' && evt.shiftKey && linkId === 'bottomlink')) {
      // prevent the event to tab to inner map
      evt.preventDefault();
      evt.stopPropagation();
      navigationLinkRef.current = linkId === 'toplink' ? `bottomlink-${focusTrapId}` : `toplink-${focusTrapId}`;

      setOpen(true);
      // when map element get focus and focus is not trap, show dialog window
      // if user move the mouse over the map, cancel the dialog
      // remove the top and bottom link from focus cycle and start the FocusTrap
      document.addEventListener('keydown', handleScrolling);
      mapHTMLElementRef.current!.addEventListener(
        'mousemove',
        () => {
          setOpen(false);
          exitFocus();
        },
        { once: true }
      );
    }
  }

  useEffect(() => {
    document.getElementById(`bottomlink-${focusTrapId}`)?.addEventListener('keydown', manageLinks);
    document.getElementById(`toplink-${focusTrapId}`)?.addEventListener('keydown', manageLinks);

    return () => {
      document.getElementById(`bottomlink-${focusTrapId}`)?.removeEventListener('keydown', manageLinks);
      document.getElementById(`toplink-${focusTrapId}`)?.removeEventListener('keydown', manageLinks);
      document.removeEventListener('keydown', handleScrolling);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Modal
      container={document.getElementById(focusTrapId)}
      mapId={focusTrapId}
      open={open}
      aria-labelledby="wcag-dialog-title"
      aria-describedby="wcag-dialog-description"
      fullScreen={fullScreen}
      sx={sxClasses.trap}
      titleId="wcag-dialog-title"
      title={t('keyboardnav.focusdialog.title')}
      contentTextId="wcag-dialog-description"
      contentModal={<HtmlToReact htmlContent={t('keyboardnav.focusdialog.main')} />}
      actions={
        <>
          <Button
            id="enable-focus"
            tooltip={t('keyboardnav.focusdialog.button.enable')!}
            tooltipPlacement="top-end"
            autoFocus
            onClick={handleEnable}
            type="text"
            style={{
              width: 'initial',
            }}
          >
            {t('keyboardnav.focusdialog.button.enable')}
          </Button>
          <Button
            id="skip-focus"
            tooltip={t('keyboardnav.focusdialog.button.skip')!}
            tooltipPlacement="top-end"
            onClick={handleSkip}
            type="text"
            style={{
              width: 'initial',
            }}
          >
            {t('keyboardnav.focusdialog.button.skip')}
          </Button>
        </>
      }
    />
  );
}
