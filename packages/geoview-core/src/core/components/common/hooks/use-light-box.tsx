import { useCallback, useState } from 'react';
import { Box } from '@/ui';
import type { LightBoxSlides } from '@/core/components/lightbox/lightbox';
import { LightboxImg } from '@/core/components/lightbox/lightbox';
import { useStoreUIActiveTrapGeoView } from '@/core/stores/states/ui-state';
import { logger } from '@/core/utils/logger';
import { TIMEOUT } from '@/core/utils/constant';

/** Regex pattern for detecting base64-encoded image strings. */
const BASE64_IMAGE_PATTERN = /^data:image\/(png|jpeg|gif|webp);base64/;

/** Properties for the base lightbox component. */
interface BaseLightBoxProps {
  isLightBoxOpen: boolean;
  slides: LightBoxSlides[];
  slidesIndex: number;
  returnFocusId: string;
  onExit: () => void;
  onSlideChange?: (index: number) => void;
}
/** Return type for the useLightBox hook. */
interface UseLightBoxReturnType {
  initLightBox: (images: string, altText: string, returnFocusId: string, index?: number) => void;
  LightBoxComponent: () => JSX.Element;
}

/**
 * Creates the base lightbox component.
 *
 * @param props - The properties defined in BaseLightBoxProps interface
 * @returns The base lightbox component
 */
function BaseLightBoxComponent({
  isLightBoxOpen,
  slides,
  slidesIndex,
  returnFocusId,
  onExit,
  onSlideChange,
}: BaseLightBoxProps): JSX.Element {
  logger.logTraceRender('components/common/hooks/use-light-box (BaseLightBoxComponent)');

  const activeTrapGeoView = useStoreUIActiveTrapGeoView();

  /**
   * Handles when the user changes slides in the lightbox.
   */
  const handleSlideChange = useCallback(
    (index: number): void => {
      onSlideChange?.(index);
    },
    [onSlideChange]
  );

  /**
   * Handles when the lightbox is exited, including restoring focus to the triggering element for accessibility.
   */
  const handleLightboxExit = useCallback((): void => {
    onExit();

    if (!activeTrapGeoView) return;

    setTimeout(() => {
      const element = document.getElementById(returnFocusId);
      if (element) {
        element.focus();
        element.classList.add('keyboard-focused');
      } else {
        logger.logWarning(`LightBox focus restoration failed: element "${returnFocusId}" not found`);
      }
    }, TIMEOUT.focusDelayLightbox);
  }, [activeTrapGeoView, returnFocusId, onExit]);

  if (!isLightBoxOpen) return <Box />;

  return (
    <LightboxImg open={isLightBoxOpen} slides={slides} index={slidesIndex} exited={handleLightboxExit} onSlideChange={handleSlideChange} />
  );
}

/**
 * Custom hook that provides lightbox functionality for displaying images.
 *
 * @returns The lightbox initializer and component
 */
export function useLightBox(): UseLightBoxReturnType {
  // Log
  logger.logTraceRenderDetailed('components/common/hooks/use-light-box');

  // State
  const [isLightBoxOpen, setIsLightBoxOpen] = useState(false);
  const [slides, setSlides] = useState<LightBoxSlides[]>([]);
  const [slidesIndex, setSlidesIndex] = useState(0);
  const [stateReturnFocusId, setReturnFocusId] = useState('0');

  /**
   * Creates the slides list from an image string.
   *
   * @param images - Semicolon-separated image URLs or a base64 string
   * @param altText - Alt text for the images
   * @returns The array of lightbox slides
   */
  const createSlidesList = useCallback((images: string, altText: string): LightBoxSlides[] => {
    if (BASE64_IMAGE_PATTERN.test(images)) {
      return [{ src: images, alt: altText, downloadUrl: '' }];
    }
    return images.split(';').map((item) => ({
      src: item,
      alt: altText,
      downloadUrl: item,
    }));
  }, []);

  /**
   * Initializes and opens the lightbox with the given images.
   */
  const handleExit = useCallback((): void => {
    setIsLightBoxOpen(false);
    setSlides([]);
    setSlidesIndex(0);
  }, []);

  /**
   * Initializes and opens the lightbox with the given images.
   *
   * @param images - Semicolon-separated image URLs or a base64 string
   * @param altText - Alt text for the images
   * @param returnFocusId - The element id to restore focus to on exit
   * @param index - Optional initial slide index
   * @param scale - Optional initial image scale
   */
  const initLightBox = useCallback(
    (images: string, altText: string, returnFocusId: string, index?: number): void => {
      setIsLightBoxOpen(true);
      setSlides(createSlidesList(images, altText));
      setSlidesIndex(index ?? 0);
      setReturnFocusId(returnFocusId);
    },
    [createSlidesList]
  );

  const LightBoxComponent = useCallback((): JSX.Element => {
    return (
      <BaseLightBoxComponent
        isLightBoxOpen={isLightBoxOpen}
        slides={slides}
        slidesIndex={slidesIndex}
        returnFocusId={stateReturnFocusId}
        onExit={handleExit}
      />
    );
  }, [isLightBoxOpen, slides, slidesIndex, stateReturnFocusId, handleExit]);

  return {
    initLightBox,
    LightBoxComponent,
  };
}
