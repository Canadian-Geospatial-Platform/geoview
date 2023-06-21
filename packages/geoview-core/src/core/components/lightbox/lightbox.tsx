import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// eslint-disable-next-line import/no-extraneous-dependencies
import Lightbox from 'yet-another-react-lightbox';
// eslint-disable-next-line import/no-unresolved
import Download from 'yet-another-react-lightbox/plugins/download';
// eslint-disable-next-line import/no-extraneous-dependencies, import/no-unresolved
import 'yet-another-react-lightbox/styles.css';

import { CloseIcon, ArrowRightIcon, ArrowLeftIcon, DownloadIcon, Tooltip } from '../../../ui';

/**
 * Interface used for lightbox properties and slides
 */
export interface LightboxProps {
  open: boolean;
  slides: LightBoxSlides[];
  index: number;
  exited: () => void;
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
  const { t } = useTranslation<string>();
  const { open, slides, index, exited } = props;

  const [isOpen, setIsOpen] = useState(open);
  const [closeOnPullDown] = useState(true);
  const [closeOnBackdropClick] = useState(true);
  const [fade] = useState(250);
  const [swipe] = useState(500);

  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  return (
    <Lightbox
      styles={{ root: { width: '90%', height: '90%', margin: 'auto' }, container: { backgroundColor: 'rgba(0, 0, 0, .9)' } }}
      open={isOpen}
      close={() => setIsOpen(false)}
      slides={slides}
      index={index}
      carousel={{ finite: true }}
      controller={{ closeOnPullDown, closeOnBackdropClick }}
      animation={{ fade, swipe }}
      labels={{ Next: t('lightbox.next'), Previous: t('lightbox.previous'), Close: t('lightbox.close'), Download: t('lightbox.download') }}
      on={{
        entered: () => {
          // TODO: Focus on close button on open #1113
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
