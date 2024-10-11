import { useState, useEffect } from 'react';

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
export interface LightboxProps {
  open: boolean;
  slides: LightBoxSlides[];
  index: number;
  exited: () => void;
  scale?: number;
}
export interface LightBoxSlides {
  src: string;
  alt: string;
  downloadUrl: string;
}

/**
 * Create an element that displays a lightbox
 *
 * @param {LightboxProps} props the lightbox properties
 * @returns {JSX.Element} created lightbox element
 */
export function LightboxImg(props: LightboxProps): JSX.Element {
  // Log
  logger.logTraceRender('components/lightbox/lightbox');

  const { open, slides, index, exited, scale = 1 } = props;

  const { t } = useTranslation<string>();

  // internal state
  const [isOpen, setIsOpen] = useState(open);
  const [closeOnPullDown] = useState(true);
  const [closeOnBackdropClick] = useState(true);
  const [fade] = useState(250);
  const [swipe] = useState(500);

  // get mapId
  const mapId = useGeoViewMapId();

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('LIGHTBOX - open', open);

    setIsOpen(open);
  }, [open]);

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
      animation={{ fade, swipe }}
      labels={{
        Next: t('lightbox.next') || undefined,
        Previous: t('lightbox.previous') || undefined,
        Close: t('lightbox.close') || undefined,
        Download: t('lightbox.download') || undefined,
      }}
      on={{
        entered: () => {
          // document.getElementsByClassName('yarl__button')[1] does not work, use main container
          document.getElementsByClassName('yarl__root')[0].getElementsByTagName('button')[1].focus();
        },
        exited,
      }}
      render={{
        iconClose: () => (
          <Tooltip title={t('lightbox.close')} placement="top">
            <CloseIcon />
          </Tooltip>
        ),
        iconNext: () => (
          <Tooltip title={t('lightbox.next')} placement="top">
            <ArrowRightIcon />
          </Tooltip>
        ),
        iconPrev: () => (
          <Tooltip title={t('lightbox.previous')} placement="top">
            <ArrowLeftIcon />
          </Tooltip>
        ),
        iconDownload: () => (
          <Tooltip title={t('lightbox.download')} placement="top">
            <DownloadIcon />
          </Tooltip>
        ),
      }}
      plugins={[Download]}
    />
  );
}
