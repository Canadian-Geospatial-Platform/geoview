/** Return type for the useLightBox hook. */
interface UseLightBoxReturnType {
    initLightBox: (images: string, altText: string, returnFocusId: string, index?: number) => void;
    LightBoxComponent: () => JSX.Element;
}
/**
 * Custom hook that provides lightbox functionality for displaying images.
 *
 * @returns The lightbox initializer and component
 */
export declare function useLightBox(): UseLightBoxReturnType;
export {};
//# sourceMappingURL=use-light-box.d.ts.map