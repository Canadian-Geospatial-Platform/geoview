/// <reference types="react" />
/**
 * Custom Lightbox hook which handle rendering of the lightbox.
 * @returns {Object}
 */
export declare function useLightBox(): {
    initLightBox: (images: string, cellId: string) => void;
    LightBoxComponent: () => import("react").JSX.Element;
};
