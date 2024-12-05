import { useState, useEffect, memo } from 'react';

import { useTranslation } from 'react-i18next';

import Lightbox from 'yet-another-react-lightbox';
import Download from 'yet-another-react-lightbox/plugins/download';
import 'yet-another-react-lightbox/styles.css';

import { CloseIcon, ArrowRightIcon, ArrowLeftIcon, DownloadIcon, Tooltip } from '@/ui';
import { logger } from '@/core/utils/logger';
import { useGeoViewMapId } from '@/core/stores/geoview-store';

/**
 * Interface used for lightbox properties and slides
 */
export interface LightBoxSlides {
  src: string;
  alt: string;
  downloadUrl: string;
}
export interface LightboxProps {
  open: boolean;
  slides: LightBoxSlides[];
  index: number;
  exited: () => void;
  scale?: number;
}

// Constants outside component to prevent recreating every render
const LIGHTBOX_CONSTANTS = {
  FADE_DURATION: 250,
  SWIPE_DURATION: 500,
  DEFAULT_SCALE: 1,
} as const;

/**
 * Create an element that displays a lightbox
 *
 * @param {LightboxProps} props the lightbox properties
 * @returns {JSX.Element} created lightbox element
 */
// Memoizes entire component, preventing re-renders if props haven't changed
export const LightboxImg = memo(function LightboxImg({
  open,
  slides,
  index,
  exited,
  scale = LIGHTBOX_CONSTANTS.DEFAULT_SCALE,
}: LightboxProps): JSX.Element {
  logger.logTraceRender('components/lightbox/lightbox');

  // Hooks
  const { t } = useTranslation<string>();

  // State
  const [isOpen, setIsOpen] = useState(open);
  const [closeOnPullDown] = useState(true);
  const [closeOnBackdropClick] = useState(true);

  // Store
  const mapId = useGeoViewMapId();

  // Update open state when prop changes
  useEffect(() => {
    logger.logTraceUseEffect('LIGHTBOX - open', open);
    setIsOpen(open);
  }, [open]);

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
        root: { width: '90%', height: '90%', margin: 'auto' },
        container: { backgroundColor: 'rgba(0, 0, 0, .9)' },
        slide: { transform: `scale(${scale})` },
      }}
      portal={{ root: document.getElementById(`shell-${mapId}`) }}
      open={isOpen}
      close={() => setIsOpen(false)}
      slides={slides}
      index={index}
      carousel={{ finite: true }}
      controller={{ closeOnPullDown, closeOnBackdropClick }}
      animation={{ fade: LIGHTBOX_CONSTANTS.FADE_DURATION, swipe: LIGHTBOX_CONSTANTS.SWIPE_DURATION }}
      labels={labels}
      on={{
        entered: () => {
          // document.getElementsByClassName('yarl__button')[1] does not work, use main container
          document.getElementsByClassName('yarl__root')[0].getElementsByTagName('button')[1].focus();
        },
        exited,
      }}
      render={{
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
      plugins={[Download]}
    />
  );
});
