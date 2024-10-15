import { useState } from 'react';
import { Box } from '@/ui';
import { LightBoxSlides, LightboxImg } from '@/core/components/lightbox/lightbox';
import { useUIActiveTrapGeoView } from '@/core/stores/store-interface-and-intial-values/ui-state';

interface UseLightBoxReturnType {
  initLightBox: (images: string, alias: string, index: number | undefined, scale?: number) => void;
  LightBoxComponent: () => JSX.Element;
}

/**
 * Custom Lightbox hook which handle rendering of the lightbox.
 * @returns {UseLightBoxReturnType}
 */
export function useLightBox(): UseLightBoxReturnType {
  // Internal state
  const [isLightBoxOpen, setIsLightBoxOpen] = useState(false);
  const [slides, setSlides] = useState<LightBoxSlides[]>([]);
  const [slidesIndex, setSlidesIndex] = useState(0);
  const [imgScale, setImgScale] = useState<number | undefined>();
  const [aliasIndex, setAliasIndex] = useState('0');

  // Store state
  const activeTrapGeoView = useUIActiveTrapGeoView();

  /**
   * Initialize lightbox with state.
   * @param {string} images images url formatted as string and joined with ';' identifier.
   * @param {string} alias alt tag for the image.
   * @param {number | undefined} index index of the image which is displayed.
   */
  const initLightBox = (images: string, alias: string, index: number | undefined, scale?: number): void => {
    setIsLightBoxOpen(true);
    let slidesList = [];
    if (images.startsWith('data:image/png;base64')) {
      // special case - check if image is base64 and its a single image
      slidesList = [{ src: images, alt: alias, downloadUrl: '' }];
    } else {
      slidesList = images.split(';').map((item) => ({ src: item, alt: alias, downloadUrl: item }));
    }
    setSlides(slidesList);
    setSlidesIndex(index ?? 0);
    setImgScale(scale);
    setAliasIndex(alias.split('_')[0]);
  };

  /**
   * Create LightBox Component based on lightbox is opened or not.
   * @returns {JSX.Element}
   */
  function LightBoxComponent(): JSX.Element {
    return isLightBoxOpen ? (
      <LightboxImg
        open={isLightBoxOpen}
        slides={slides}
        index={slidesIndex}
        scale={imgScale}
        exited={() => {
          setIsLightBoxOpen(false);
          setSlides([]);
          setSlidesIndex(0);

          // If keyboard navigation mode enable, focus to caller item (with timeout so keyboard-focused class can be applied)
          if (activeTrapGeoView) {
            setTimeout(() => {
              const element = document.querySelector(`.returnLightboxFocusItem-${aliasIndex}`) as HTMLElement;
              element?.focus();
              element?.classList.add('keyboard-focused');
            }, 250);
          }
        }}
      />
    ) : (
      <Box />
    );
  }
  return { initLightBox, LightBoxComponent };
}
