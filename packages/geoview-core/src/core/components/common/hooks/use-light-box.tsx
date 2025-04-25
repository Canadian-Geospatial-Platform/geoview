import { memo, useCallback, useEffect, useState } from 'react';
import { Box } from '@/ui';
import { LightBoxSlides, LightboxImg } from '@/core/components/lightbox/lightbox';
import { useUIActiveTrapGeoView } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { logger } from '@/core/utils/logger';

// Constants outside component to prevent recreating every render
const FOCUS_DELAY = 250;
const BASE64_IMAGE_PATTERN = /^data:image\/(png|jpeg|gif|webp);base64/;
const MIN_SCALE = 1;

// Define props interface for BaseLightBoxComponent
interface BaseLightBoxProps {
  isLightBoxOpen: boolean;
  slides: LightBoxSlides[];
  slidesIndex: number;
  imgScale?: number;
  aliasIndex: string;
  onExit: () => void;
  onSlideChange?: (index: number) => void;
}
interface UseLightBoxReturnType {
  initLightBox: (images: string, alias: string, index?: number, scale?: number) => void;
  LightBoxComponent: () => JSX.Element;
}

const BaseLightBoxComponent = memo(function BaseLightBoxComponent({
  isLightBoxOpen,
  slides,
  slidesIndex,
  imgScale,
  aliasIndex,
  onExit,
  onSlideChange,
}: BaseLightBoxProps) {
  logger.logTraceRender('components/common/use-lightbox (BaseLightBoxComponent)');

  const [currentScale, setCurrentScale] = useState(imgScale);
  const activeTrapGeoView = useUIActiveTrapGeoView();

  // Calculate scale when image changes
  const calculateScale = useCallback((imageUrl: string) => {
    // Log
    logger.logTraceUseCallback('USE-LIGHT-BOX - calculateScale');

    const img = new Image();
    img.onload = () => {
      const container = document.querySelector('.yarl__container');
      if (container) {
        const containerRect = container.getBoundingClientRect();
        const availableWidth = containerRect.width - 40;
        const availableHeight = containerRect.height - 40;

        // Calculate aspect ratios
        const containerAspectRatio = availableWidth / availableHeight;
        const imageAspectRatio = img.width / img.height;

        // If image is taller than container (portrait)
        let finalScale;
        if (imageAspectRatio < containerAspectRatio) {
          // Use height as the primary constraint
          finalScale = availableHeight / img.height;
        } else {
          // Use width as the primary constraint
          finalScale = availableWidth / img.width;
        }

        // Set a minimum scale to prevent images from being too small
        finalScale = Math.max(finalScale, MIN_SCALE);

        setCurrentScale(finalScale);
        logger.logDebug('LightBox Scale', finalScale, img.width, img.height);
      }
    };
    img.src = imageUrl;
  }, []);

  const handleSlideChange = useCallback(
    (index: number) => {
      if (slides[index]) {
        calculateScale(slides[index].src);
      }
      onSlideChange?.(index); // Call the prop if provided
    },
    [calculateScale, onSlideChange, slides]
  );

  // Update scale when slides or index changes
  useEffect(() => {
    if (slides[slidesIndex]) {
      calculateScale(slides[slidesIndex].src);
    }
  }, [slides, slidesIndex, calculateScale]);

  const handleLightboxExit = useCallback(() => {
    onExit();

    if (!activeTrapGeoView) return;

    setTimeout(() => {
      const element = document.querySelector(`.returnLightboxFocusItem-${aliasIndex}`) as HTMLElement;
      if (element) {
        element.focus();
        element.classList.add('keyboard-focused');
      }
    }, FOCUS_DELAY);
  }, [activeTrapGeoView, aliasIndex, onExit]);

  if (!isLightBoxOpen) return <Box />;

  return (
    <LightboxImg
      open={isLightBoxOpen}
      slides={slides}
      index={slidesIndex}
      scale={currentScale}
      exited={handleLightboxExit}
      onSlideChange={handleSlideChange}
    />
  );
});

export function useLightBox(): UseLightBoxReturnType {
  // Log
  logger.logTraceRenderDetailed('components/common/use-light-box');

  // State
  const [isLightBoxOpen, setIsLightBoxOpen] = useState(false);
  const [slides, setSlides] = useState<LightBoxSlides[]>([]);
  const [slidesIndex, setSlidesIndex] = useState(0);
  const [imgScale, setImgScale] = useState<number | undefined>();
  const [aliasIndex, setAliasIndex] = useState('0');

  // Callbacks
  const createSlidesList = useCallback((images: string, alias: string): LightBoxSlides[] => {
    if (BASE64_IMAGE_PATTERN.test(images)) {
      return [{ src: images, alt: alias, downloadUrl: '' }];
    }
    return images.split(';').map((item) => ({
      src: item,
      alt: alias,
      downloadUrl: item,
    }));
  }, []);

  const handleExit = useCallback(() => {
    setIsLightBoxOpen(false);
    setSlides([]);
    setSlidesIndex(0);
  }, []);

  const initLightBox = useCallback(
    (images: string, alias: string, index?: number, scale?: number): void => {
      setIsLightBoxOpen(true);
      setSlides(createSlidesList(images, alias));
      setSlidesIndex(index ?? 0);
      setImgScale(scale);
      setAliasIndex(alias.split('_')[0]);
    },
    [createSlidesList]
  );

  const LightBoxComponent = useCallback(() => {
    return (
      <BaseLightBoxComponent
        isLightBoxOpen={isLightBoxOpen}
        slides={slides}
        slidesIndex={slidesIndex}
        imgScale={imgScale}
        aliasIndex={aliasIndex}
        onExit={handleExit}
      />
    );
  }, [isLightBoxOpen, slides, slidesIndex, imgScale, aliasIndex, handleExit]);

  return {
    initLightBox,
    LightBoxComponent,
  };
}
