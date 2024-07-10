/// <reference types="react" />
interface UseLightBoxReturnType {
    initLightBox: (images: string, alias: string, index: number | undefined) => void;
    LightBoxComponent: () => JSX.Element;
}
/**
 * Custom Lightbox hook which handle rendering of the lightbox.
 * @returns {UseLightBoxReturnType}
 */
export declare function useLightBox(): UseLightBoxReturnType;
export {};
