import { useState } from 'react';
import { LightBoxSlides, LightboxImg } from '@/app';
import { Box } from '@/ui';
/**
 * Custom Lightbox hook which handle rendering of the lightbox.
 * @returns {Object}
 */
export function useLightBox() {
  const [isLightBoxOpen, setIsLightBoxOpen] = useState(false);
  const [slides, setSlides] = useState<LightBoxSlides[]>([]);
  const [slidesIndex, setSlidesIndex] = useState(0);

  /**
   * Initialize lightbox with state.
   * @param {string} images images url formatted as string and joined with ';' identifier.
   * @param {string} cellId id of the cell.
   */
  const initLightBox = (images: string, cellId: string) => {
    setIsLightBoxOpen(true);
    const slidesList = images.split(';').map((item) => ({ src: item, alt: cellId, downloadUrl: item }));
    setSlides(slidesList);
  };

  /**
   * Create LightBox Component based on lightbox is opened or not.
   * @returns JSX.Element
   */
  function LightBoxComponent() {
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
