import { memo, useCallback, useState } from 'react';
import { Box } from '@/ui';
import { LightBoxSlides, LightboxImg } from '@/core/components/lightbox/lightbox';
import { useUIActiveTrapGeoView } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { logger } from '@/core/utils/logger';

// Constants outside component to prevent recreating every render
const FOCUS_DELAY = 250;
const BASE64_IMAGE_PATTERN = /^data:image\/(png|jpeg|gif|webp);base64/;

// Define props interface for BaseLightBoxComponent
interface BaseLightBoxProps {
  isLightBoxOpen: boolean;
  slides: LightBoxSlides[];
  slidesIndex: number;
  imgScale?: number;
  aliasIndex: string;
  onExit: () => void;
}
interface UseLightBoxReturnType {
  initLightBox: (images: string, alias: string, index?: number, scale?: number) => void;
  LightBoxComponent: () => JSX.Element;
}

// Memoized base component with props
// TODO: Unmemoize this component, probably, because it's in 'common' folder
const BaseLightBoxComponent = memo(function BaseLightBoxComponent({
  isLightBoxOpen,
  slides,
  slidesIndex,
  imgScale,
  aliasIndex,
  onExit,
}: BaseLightBoxProps) {
  logger.logTraceRender('components/common/use-lightbox (BaseLightBoxComponent)');
  // Store
  const activeTrapGeoView = useUIActiveTrapGeoView();

  // Callbacks
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

  return <LightboxImg open={isLightBoxOpen} slides={slides} index={slidesIndex} scale={imgScale} exited={handleLightboxExit} />;
});

export function useLightBox(): UseLightBoxReturnType {
  // TODO: logger - should we have anotherlevel of logger of thing that log too much?
  logger.logTraceRender('components/common/use-light-box');

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
