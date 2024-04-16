import { useState } from 'react';
import { Box } from '@/ui';
import { LightBoxSlides, LightboxImg } from '@/core/components/lightbox/lightbox';
/**
 * Custom Lightbox hook which handle rendering of the lightbox.
 * @returns {Object}
 */
// TODO: Refactor - Maybe worth creating an explicit type here instead of 'any'?
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useLightBox(): any {
  const [isLightBoxOpen, setIsLightBoxOpen] = useState(false);
  const [slides, setSlides] = useState<LightBoxSlides[]>([]);
  const [slidesIndex, setSlidesIndex] = useState(0);

  /**
   * Initialize lightbox with state.
   * @param {string} images images url formatted as string and joined with ';' identifier.
   * @param {string} cellId id of the cell.
   */
  const initLightBox = (images: string, cellId: string): void => {
    setIsLightBoxOpen(true);
    const slidesList = images.split(';').map((item) => ({ src: item, alt: cellId, downloadUrl: item }));
    setSlides(slidesList);
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
        exited={() => {
          setIsLightBoxOpen(false);
          setSlides([]);
          setSlidesIndex(0);
        }}
      />
    ) : (
      <Box />
    );
  }
  return { initLightBox, LightBoxComponent };
}
