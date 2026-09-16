import { useState, useEffect, useCallback, memo } from 'react';

import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';

import type { ViewCallbackProps } from 'yet-another-react-lightbox';
import Lightbox, { useController, useNavigationState, cssClass, ELEMENT_BUTTON } from 'yet-another-react-lightbox';
import Download from 'yet-another-react-lightbox/plugins/download';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';

import { CloseIcon, ArrowRightIcon, ArrowLeftIcon, DownloadIcon, Tooltip, IconButton } from '@/ui';
import { logger } from '@/core/utils/logger';
import { getGVShellElement } from '@/core/utils/dom-helper';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import { LIGHTBOX_SELECTORS } from '@/core/utils/constant';
import { useStoreUIActiveTrapGeoView } from '@/core/stores/states/ui-state';
import { useStoreAppShellContainer } from '@/core/stores/states/app-state';

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
  Z_INDEX: 2000,
} as const;

/** Props for the LightboxNavButton component. */
interface LightboxNavButtonProps {
  /** The navigation direction the button controls. */
  direction: 'prev' | 'next';
}

/**
 * Renders the lightbox Previous/Next navigation button.
 *
 * Fully replaces the library's default navigation button (render.buttonPrev/buttonNext take over
 * its rendering entirely, including its CSS class) so aria-disabled can be used instead of the
 * native disabled attribute, keeping keyboard focus on the button at the first/last slide.
 *
 * @param props - Properties defined in LightboxNavButtonProps interface
 * @returns The navigation button element
 */
function LightboxNavButton({ direction }: LightboxNavButtonProps): JSX.Element {
  // Log
  logger.logTraceRender('components/lightbox/lightbox > LightboxNavButton');

  const { t } = useTranslation<string>();
  const theme = useTheme();
  const { prev, next } = useController();
  const { prevDisabled, nextDisabled } = useNavigationState();
  const isDisabled = direction === 'prev' ? prevDisabled : nextDisabled;
  const label = direction === 'prev' ? t('lightbox.previous') : t('lightbox.next');

  /**
   * Handles when the user activates the navigation button.
   */
  const handleClick = useCallback((): void => {
    // Guard - the library already no-ops at the boundary, kept for the aria-disabled convention
    if (isDisabled) return;
    (direction === 'prev' ? prev : next)();
  }, [direction, isDisabled, prev, next]);

  return (
    <IconButton
      disableRipple
      className={`${cssClass(ELEMENT_BUTTON)} ${cssClass(`navigation_${direction}`)}`}
      aria-label={label}
      aria-disabled={isDisabled}
      tooltip={label}
      tooltipPlacement="top"
      onClick={handleClick}
      sx={{
        '&[aria-disabled="true"]': {
          opacity: theme.palette.action.disabledOpacity,
          cursor: 'not-allowed',
        },
      }}
    >
      {direction === 'prev' ? <ArrowLeftIcon /> : <ArrowRightIcon />}
    </IconButton>
  );
}

/**
 * Creates the lightbox image viewer component.
 *
 * Memoized to prevent re-renders when parent updates but lightbox props have not changed.
 *
 * @returns The lightbox element
 */
export const LightboxImg = memo(({ open, slides, index, exited, onSlideChange }: LightboxProps): JSX.Element => {
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
  const shellContainer = useStoreAppShellContainer();

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
    const shellElement = getGVShellElement(mapId);
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

      // The lightbox is a single page-wide overlay (yarl portal); a global check is intentional.
      // eslint-disable-next-line no-restricted-syntax
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
        // Keep the lightbox above all shell UI so it stays focus-trapped and unobstructed
        root: { zIndex: LIGHTBOX_CONSTANTS.Z_INDEX },
        container: { backgroundColor: 'rgba(0, 0, 0, .9)' },
      }}
      portal={{ root: shellContainer }}
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
          // The lightbox is a single page-wide overlay (yarl portal); a global check is intentional.
          // eslint-disable-next-line no-restricted-syntax
          const toolbar = document.querySelector(LIGHTBOX_SELECTORS.ROOT)?.querySelector(LIGHTBOX_SELECTORS.TOOLBAR);
          const lastButton = toolbar?.querySelector('button:last-of-type') as HTMLButtonElement | null;
          lastButton?.focus();
        },
        exited,
        view: (props: ViewCallbackProps) => onSlideChange?.(props.index),
      }}
      render={{
        buttonPrev: slides.length <= 1 ? () => null : () => <LightboxNavButton direction="prev" />,
        buttonNext: slides.length <= 1 ? () => null : () => <LightboxNavButton direction="next" />,
        iconClose: () => (
          <Tooltip title={labels.Close} placement="top">
            <CloseIcon />
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
LightboxImg.displayName = 'LightboxImg';
