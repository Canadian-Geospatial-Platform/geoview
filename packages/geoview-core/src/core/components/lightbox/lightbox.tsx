import { useState, useEffect, memo } from 'react';

import { useTranslation } from 'react-i18next';

import type { ViewCallbackProps } from 'yet-another-react-lightbox';
import Lightbox from 'yet-another-react-lightbox';
import Download from 'yet-another-react-lightbox/plugins/download';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';

import { CloseIcon, ArrowRightIcon, ArrowLeftIcon, DownloadIcon, Tooltip } from '@/ui';
import { logger } from '@/core/utils/logger';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import { LIGHTBOX_SELECTORS } from '@/core/utils/constant';
import { useStoreUIActiveTrapGeoView } from '@/core/stores/store-interface-and-intial-values/ui-state';

/** Slide definition for the lightbox. */
export interface LightBoxSlides {
  /** The image source URL. */
  src: string;
  /** The image alt text. */
  alt: string;
  /** The download URL for the image. */
  downloadUrl: string;
}

/** Props for the LightboxImg component. */
export interface LightboxProps {
  /** Whether the lightbox is open. */
  open: boolean;
  /** The slides to display. */
  slides: LightBoxSlides[];
  /** The initial slide index. */
  index: number;
  /** Callback invoked when the lightbox exit animation completes. */
  exited: () => void;
  /** Optional callback invoked when the active slide changes. */
  onSlideChange?: (index: number) => void;
}

/** Animation duration constants for the lightbox transitions. */
const LIGHTBOX_CONSTANTS = {
  FADE_DURATION: 250,
  SWIPE_DURATION: 500,
} as const;

/**
 * Creates the lightbox image viewer component.
 *
 * Memoized to prevent re-renders when parent updates but lightbox props have not changed.
 *
 * @returns The lightbox element
 */
export const LightboxImg = memo(function LightboxImg({ open, slides, index, exited, onSlideChange }: LightboxProps): JSX.Element {
  logger.logTraceRender('components/lightbox/lightbox');

  // Hooks
  const { t } = useTranslation<string>();

  // State
  const [isOpen, setIsOpen] = useState(open);
  const [closeOnPullDown] = useState(true);
  const [closeOnBackdropClick] = useState(true);

  // Store
  const mapId = useStoreGeoViewMapId();
  const activeTrapGeoView = useStoreUIActiveTrapGeoView();

  /**
   * Syncs internal open state when the prop changes.
   */
  useEffect(() => {
    logger.logTraceUseEffect('LIGHTBOX - open', open);
    setIsOpen(open);
  }, [open]);

  /**
   * Manages inert attribute on shell children when the lightbox opens or closes.
   */
  useEffect(() => {
    const shellElement = document.getElementById(`shell-${mapId}`);
    if (!shellElement) return;

    if (activeTrapGeoView && isOpen) {
      // Make all shell children inert except the lightbox
      Array.from(shellElement.children).forEach((child) => {
        // Don't make the lightbox root inert
        if (!child.classList.contains('yarl__root')) {
          child.setAttribute('inert', '');
        }
      });
    } else {
      // Remove inert from all children
      Array.from(shellElement.children).forEach((child) => {
        child.removeAttribute('inert');
      });
    }

    return () => {
      if (!shellElement) {
        return;
      }
      Array.from(shellElement.children).forEach((child) => {
        child.removeAttribute('inert');
      });
    };
  }, [isOpen, activeTrapGeoView, mapId]);

  /**
   * Traps focus within lightbox buttons when open.
   */
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key !== 'Tab') return;

      const lightboxRoot = document.querySelector(LIGHTBOX_SELECTORS.ROOT);
      if (!lightboxRoot) return;

      const focusableElements = lightboxRoot.querySelectorAll('button:not([disabled])');
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Memoized labels
  const labels = {
    Next: t('lightbox.next'),
    Previous: t('lightbox.previous'),
    Close: t('lightbox.close'),
    Download: t('lightbox.download'),
  };

  return (
    <Lightbox
      styles={{
        container: { backgroundColor: 'rgba(0, 0, 0, .9)' },
      }}
      portal={{ root: document.getElementById(`shell-${mapId}`) }}
      open={isOpen}
      close={() => setIsOpen(false)}
      slides={slides}
      zoom={{
        maxZoomPixelRatio: 1.5,
      }}
      index={index}
      carousel={{ finite: true, imageFit: 'contain' }}
      controller={{ closeOnPullDown, closeOnBackdropClick }}
      animation={{ fade: LIGHTBOX_CONSTANTS.FADE_DURATION, swipe: LIGHTBOX_CONSTANTS.SWIPE_DURATION }}
      labels={labels}
      on={{
        entered: () => {
          const toolbar = document.querySelector(LIGHTBOX_SELECTORS.ROOT)?.querySelector(LIGHTBOX_SELECTORS.TOOLBAR);
          const lastButton = toolbar?.querySelector('button:last-of-type') as HTMLButtonElement | null;
          lastButton?.focus();
        },
        exited,
        view: (props: ViewCallbackProps) => onSlideChange?.(props.index),
      }}
      render={{
        buttonPrev: slides.length <= 1 ? () => null : undefined,
        buttonNext: slides.length <= 1 ? () => null : undefined,
        iconClose: () => (
          <Tooltip title={labels.Close} placement="top">
            <CloseIcon />
          </Tooltip>
        ),
        iconNext: () => (
          <Tooltip title={labels.Next} placement="top">
            <ArrowRightIcon />
          </Tooltip>
        ),
        iconPrev: () => (
          <Tooltip title={labels.Previous} placement="top">
            <ArrowLeftIcon />
          </Tooltip>
        ),
        iconDownload: () => (
          <Tooltip title={labels.Download} placement="top">
            <DownloadIcon />
          </Tooltip>
        ),
      }}
      plugins={[Download, Zoom]}
    />
  );
});
